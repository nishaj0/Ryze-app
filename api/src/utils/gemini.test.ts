import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ generateContent: vi.fn(), GoogleGenAI: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: mocks.GoogleGenAI,
}));

import { callGeminiWithTools } from "./gemini";

describe("callGeminiWithTools", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    mocks.generateContent.mockReset();
    mocks.GoogleGenAI.mockImplementation(function () { return { models: { generateContent: mocks.generateContent } }; });
  });

  it("registers function declarations and returns function results to Gemini", async () => {
    mocks.generateContent
      .mockResolvedValueOnce({
        functionCalls: [{ id: "call-1", name: "getCurrentSplit", args: {} }],
        candidates: [{ content: { role: "model", parts: [{ functionCall: { id: "call-1", name: "getCurrentSplit", args: {} } }] } }],
      })
      .mockResolvedValueOnce({ text: "Your current split is Push Pull Legs.", functionCalls: [] });
    const execute = vi.fn().mockResolvedValue({ name: "Push Pull Legs" });

    const result = await callGeminiWithTools({
      systemPrompt: "Use the tool.",
      userPrompt: "Show my split",
      tools: [{ name: "getCurrentSplit", description: "Get the split", parameters: { type: "object", properties: {} } }],
      execute,
    });

    expect(mocks.generateContent.mock.calls[0][0].config.tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ functionDeclarations: [expect.objectContaining({ name: "getCurrentSplit" })] }),
    ]));
    expect(execute).toHaveBeenCalledWith("getCurrentSplit", {});
    expect(mocks.generateContent.mock.calls[1][0].contents[2].parts[0].functionResponse).toMatchObject({ name: "getCurrentSplit", id: "call-1", response: { result: { name: "Push Pull Legs" } } });
    expect(result.reply).toBe("Your current split is Push Pull Legs.");
  });
});
