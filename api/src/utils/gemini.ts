const TIMEOUT_MS = 15_000;

let client: any = null;

async function getClient(): Promise<any> {
  if (!client) {
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
): Promise<T | null> {
  const { systemPrompt, userPrompt, responseSchema } = options;

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

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

    if (!response.text) {
      console.error("[Gemini] Empty response text");
      return null;
    }

    return JSON.parse(response.text) as T;
  } catch (error) {
    console.error("[Gemini] Error:", error);
    return null;
  }
}
