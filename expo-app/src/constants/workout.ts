/**
 * Active Workout, Deload, and Routine Defaults for Ryze
 */

export const WORKOUT_CONSTANTS = {
  // Deload modifier (-30% volume load reduction)
  DELOAD_LOAD_FACTOR: 0.70,
  DELOAD_PERCENT_LABEL: "-30% LOAD",

  // Rest Timer defaults (in seconds)
  DEFAULT_REST_SECONDS: 90,
  SHORT_REST_SECONDS: 60,
  LONG_REST_SECONDS: 180,

  // Default Set & Rep ranges
  DEFAULT_TARGET_SETS: 3,
  DEFAULT_REPS_MIN: 8,
  DEFAULT_REPS_MAX: 12,
  DEFAULT_RPE: 8,

  // Weight increments in kilograms
  WEIGHT_STEP_KG: 2.5,
  WEIGHT_STEP_FINE_KG: 1.25,

  // Movement visual loop cadence
  POSTURE_ANIMATION_INTERVAL_MS: 1200,

  // Search debounce delay
  SEARCH_DEBOUNCE_MS: 200,

  // Stopwatch tick interval
  STOPWATCH_TICK_MS: 1000,
} as const;
