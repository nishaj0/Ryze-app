const TIMEOUT_MS = 100_000; // 100s — AI split generation can take 30s+ for large exercise lists

let client: any = null;

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

async function getClient(): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("AI service not configured. Missing GEMINI_API_KEY.");
  }
  if (!client) {
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

interface CallGeminiOptions {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
}

export async function callGemini<T>(
  options: CallGeminiOptions
): Promise<T> {
  const { systemPrompt, userPrompt, responseSchema } = options;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

  try {
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        abortSignal: abortController.signal,
      },
    });

    clearTimeout(timeoutId);

    const text = response.text;
    if (!text) {
      // Log the full response to help diagnose issues
      console.error("[Gemini] Empty response. Full response:", JSON.stringify(response, null, 2));
      throw new GeminiError("AI returned empty response. Please try again.");
    }

    let parsed: T;
    try {
      parsed = JSON.parse(text) as T;
    } catch {
      console.error("[Gemini] Failed to parse response:", text);
      throw new GeminiError("Invalid AI response format. Please try again.");
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof GeminiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new GeminiError("AI service timeout. Please try again.");
      }
      console.error("[Gemini] Error:", error.message, error.stack);
      throw new GeminiError(`AI service error: ${error.message}`);
    }

    console.error("[Gemini] Unknown error:", error);
    throw new GeminiError("Unknown AI service error. Please try again.");
  }
}
