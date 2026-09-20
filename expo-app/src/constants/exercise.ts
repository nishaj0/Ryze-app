/**
 * Exercise, Anatomical Muscle Groups, and Biomechanical Constants for Ryze
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

export const EQUIPMENT_TYPES = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Bodyweight",
  "Kettlebell",
  "Bands",
  "Smith Machine",
  "Other",
] as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[number];

export const MECHANIC_TYPES = [
  "Compound",
  "Isolation",
] as const;

export type MechanicType = typeof MECHANIC_TYPES[number];

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

export const TRAINING_GOALS = [
  "hypertrophy",
  "strength",
  "endurance",
  "general_fitness",
] as const;

export type TrainingGoal = typeof TRAINING_GOALS[number];
