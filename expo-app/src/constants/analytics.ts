/**
 * Analytics, Biomechanical Volume, and Progression Defaults for Ryze
 */

export const ANALYTICS_CONSTANTS = {
  // Baseline fallback volume in kilograms
  DEFAULT_WEEKLY_VOLUME_KG: 14850,

  // Weekly workout target
  TARGET_SESSIONS_PER_WEEK: 5,

  // Default monthly PR baseline
  DEFAULT_MONTHLY_PRS: 6,

  // Volume history tracking range
  VOLUME_HISTORY_WEEKS: 8,

  // Heatmap tracking days
  HEATMAP_DAYS_COUNT: 90,

  // Terracotta intensity volume ratio thresholds
  VOLUME_SCALE_THRESHOLDS: {
    NONE: 0,
    LIGHT: 0.15,
    MEDIUM: 0.40,
    HEAVY: 0.70,
  },
} as const;
