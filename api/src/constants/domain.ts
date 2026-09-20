/**
 * Domain and Fitness Rules Constants for Ryze API
 */

export const MUSCLE_GROUPS = [
  "All",
  "Abdominals",
  "Chest",
  "Lats",
  "Middle Back",
  "Lower Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quadriceps",
  "Hamstrings",
  "Calves",
  "Glutes",
  "Traps",
  "Neck",
  "Cardio",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export const TRAINING_GOALS = [
  "hypertrophy",
  "strength",
  "endurance",
  "general_fitness",
] as const;

export const DELOAD_MODIFIERS = {
  VOLUME_FACTOR: 0.70,
  REDUCTION_PERCENTAGE: 30,
} as const;
