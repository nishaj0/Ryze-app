/**
 * API, Networking, and Local Storage Key Constants for Ryze
 */

export const API_TIMEOUTS = {
  // Standard REST queries
  STANDARD: 15_000,

  // Generative AI and multi-turn tool loops
  AI: 60_000,

  // Cloudinary media uploads
  UPLOAD: 120_000,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "ryze_token",
  USER: "ryze_user",
  THEME: "theme_preference",
  OFFLINE_WORKOUT: "ryze_offline_workout",
  COMPLETED_ONBOARDING: "ryze_onboarding_done",
} as const;
