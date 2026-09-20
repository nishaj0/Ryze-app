/**
 * Gemini and Generative AI Constants for Ryze API
 */

export const GEMINI_CONFIG = {
  DEFAULT_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  TIMEOUT_MS: 100_000,
  RETRY_MAX: 3,
  RETRY_BASE_DELAY_MS: 2_000,
} as const;
