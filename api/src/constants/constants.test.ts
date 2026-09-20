import { describe, it, expect } from "vitest";
import {
  GEMINI_CONFIG,
  MUSCLE_GROUPS,
  DELOAD_MODIFIERS,
  API_LIMITS,
} from "./index";

describe("api centralized constants", () => {
  it("should export Gemini AI configuration", () => {
    expect(GEMINI_CONFIG.DEFAULT_MODEL).toBeDefined();
    expect(GEMINI_CONFIG.TIMEOUT_MS).toBe(100_000);
    expect(GEMINI_CONFIG.RETRY_MAX).toBe(3);
  });

  it("should export domain muscle groups and deload rules", () => {
    expect(MUSCLE_GROUPS.length).toBe(17);
    expect(DELOAD_MODIFIERS.VOLUME_FACTOR).toBe(0.70);
    expect(DELOAD_MODIFIERS.REDUCTION_PERCENTAGE).toBe(30);
  });

  it("should export pagination and API limits", () => {
    expect(API_LIMITS.DEFAULT_PAGE_SIZE).toBe(20);
    expect(API_LIMITS.MAX_PAGE_SIZE).toBe(100);
    expect(API_LIMITS.MAX_IMAGE_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });
});
