import { createLogger, getLogContext } from "./logger";

const log = createLogger("gemini");

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

export type GeminiFunctionDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type GeminiToolCall = {
  id?: string;
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

type CallGeminiWithToolsOptions = {
  systemPrompt: string;
  userPrompt: string;
  tools: GeminiFunctionDeclaration[];
  execute: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

function buildCallMeta(options: CallGeminiOptions) {
  const context = getLogContext();
  return {
    model: "gemini-2.5-flash",
    systemPromptLen: options.systemPrompt.length,
    userPromptLen: options.userPrompt.length,
    schemaKeys: Object.keys(options.responseSchema),
    reqId: context?.reqId,
    runId: context?.runId,
  };
}

const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 2_000; // 2s, 4s, 8s

/** Returns true if the error is a transient Gemini 503 / UNAVAILABLE */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("overloaded")
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini<T>(
  options: CallGeminiOptions
): Promise<T> {
  const start = Date.now();
  const meta = buildCallMeta(options);

  log.debug(meta, "gemini:start");

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

    try {
      const ai = await getClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: options.userPrompt,
        config: {
          systemInstruction: options.systemPrompt,
          responseMimeType: "application/json",
          responseJsonSchema: options.responseSchema,
          abortSignal: abortController.signal,
        },
      });

      clearTimeout(timeoutId);

      const text = response.text;
      if (!text) {
        log.warn(
          {
            ...meta,
            responseKeys: Object.keys(response || {}),
            responseText: response?.text,
          },
          "gemini:empty"
        );
        throw new GeminiError("AI returned empty response. Please try again.");
      }

      let parsed: T;
      try {
        parsed = JSON.parse(text) as T;
      } catch {
        log.error(
          { ...meta, text: text.slice(0, 1000) },
          "gemini:parse-fail"
        );
        throw new GeminiError("Invalid AI response format. Please try again.");
      }

      log.debug(
        {
          ...meta,
          attempt,
          durationMs: Date.now() - start,
          responseTextLen: text.length,
          parsedKeys: Object.keys(parsed as object),
        },
        "gemini:ok"
      );

      return parsed;
    } catch (error) {
      clearTimeout(timeoutId);

      // Never retry on errors we explicitly threw
      if (error instanceof GeminiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          log.error({ ...meta, timeoutMs: TIMEOUT_MS }, "gemini:timeout");
          throw new GeminiError("AI service timeout. Please try again.");
        }

        // 503 / UNAVAILABLE — retry with exponential backoff
        if (isRetryable(error) && attempt < RETRY_MAX) {
          const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          log.warn(
            { ...meta, attempt, retryInMs: delayMs, err: error.message },
            "gemini:retry"
          );
          await sleep(delayMs);
          continue;
        }

        // Final attempt or non-retryable error
        log.error({ ...meta, attempt, err: error }, "gemini:error");
        throw new GeminiError(`AI service error: ${error.message}`);
      }

      log.error({ ...meta, attempt, err: error }, "gemini:unknown-error");
      throw new GeminiError("Unknown AI service error. Please try again.");
    }
  }

  // TypeScript exhaustiveness — loop above always returns or throws
  throw new GeminiError("AI service unavailable after retries. Please try again later.");
}

/**
 * Runs Gemini's native function-calling loop. Tool results are returned to the
 * model as function responses, so the final text can be grounded in the data
 * that was actually retrieved.
 */
export async function callGeminiWithTools(options: CallGeminiWithToolsOptions): Promise<{ reply: string; calls: GeminiToolCall[] }> {
  const ai = await getClient();
  const meta = {
    ...buildCallMeta({ ...options, responseSchema: {} }),
    toolNames: options.tools.map((tool) => tool.name),
  };
  const contents: any[] = [{ role: "user", parts: [{ text: options.userPrompt }] }];
  const calls: GeminiToolCall[] = [];

  for (let turn = 0; turn < 3; turn++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: options.systemPrompt,
        tools: [{ functionDeclarations: options.tools }],
      },
    });
    const functionCalls = Array.isArray(response.functionCalls) ? response.functionCalls : [];

    if (functionCalls.length === 0) {
      const reply = String(response.text || "I couldn't prepare that response. Please try again.").trim();
      log.debug({ ...meta, turn, callCount: calls.length, replyLength: reply.length }, "gemini:tool-loop-complete");
      return { reply, calls };
    }

    const responses: any[] = [];
    for (const functionCall of functionCalls) {
      const name = String(functionCall.name || "");
      const args = (functionCall.args && typeof functionCall.args === "object" ? functionCall.args : {}) as Record<string, unknown>;
      let result: unknown;
      try {
        result = await options.execute(name, args);
        log.debug({ ...meta, turn, name, args, result }, "gemini:function-call");
      } catch (error) {
        result = { error: error instanceof Error ? error.message : "Tool execution failed" };
        log.warn({ ...meta, turn, name, args, result }, "gemini:function-call-failed");
      }
      calls.push({ id: functionCall.id, name, args, result });
      responses.push({ functionResponse: { name, response: { result }, id: functionCall.id } });
    }

    contents.push(response.candidates?.[0]?.content);
    contents.push({ role: "user", parts: responses });
  }

  log.warn({ ...meta, callCount: calls.length }, "gemini:tool-loop-limit");
  return { reply: "I retrieved the relevant information below.", calls };
}
