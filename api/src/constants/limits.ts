/**
 * Pagination, Rate Limiting, and Payload Limits for Ryze API
 */

export const API_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_IMAGE_UPLOAD_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_CHAT_HISTORY_CONTEXT_ITEMS: 10,
  MAX_WORKOUT_HISTORY_DAYS: 365,
} as const;
