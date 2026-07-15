export interface User {
  id: string;
  email: string;
  name: string | null;
  gender: string | null;
  goal: string | null;
  experienceLevel: string | null;
  daysAvailable: number | null;
  equipmentAccess: string | null;
  sleepHours: number | null;
  currentWeight: number | null;
  height: number | null;
  units: string;
  onboardingDone: boolean;
  reminderTime: string | null;
  weeklyCheckin: boolean;
  createdAt: string;
}

export interface Split {
  id: string;
  name: string;
  description: string | null;
  type: string;
  daysPerWeek: number;
  isPrebuilt: boolean;
  days: SplitDay[];
}

export interface SplitDay {
  id: string;
  splitId: string;
  dayNumber: number;
  name: string;
  muscleGroups: string;
  isRest: boolean;
  exercises?: SplitDayExercise[];
}

export interface SplitDayExercise {
  id: string;
  splitDayId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  notes: string | null;
  exercise: Exercise;
}

export interface Exercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  category: string;
  instructions: string | null;
  muscles?: ExerciseMuscle[];
  images?: ExerciseImage[];
  alternativesFrom?: ExerciseAlternative[];
}

export interface ExerciseMuscle {
  id: string;
  exerciseId: string;
  muscleId: string;
  isPrimary: boolean;
  muscle: Muscle;
}

export interface Muscle {
  id: string;
  name: string;
}

export interface ExerciseImage {
  id: string;
  exerciseId: string;
  url: string;
  publicId: string;
  order: number;
}

export interface ExerciseAlternative {
  id: string;
  exerciseId: string;
  alternativeId: string;
  reason: string;
  alternative: Exercise;
}

export interface UserSplit {
  id: string;
  userId: string;
  splitId: string;
  startDate: string;
  isActive: boolean;
  phase: string | null;
  split: Split;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  splitDayId: string;
  date: string;
  status: string;
  restReason: string | null;
  notes: string | null;
  durationMinutes: number | null;
  splitDay?: SplitDay;
  exerciseLogs?: ExerciseLog[];
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  exercise: Exercise;
  setLogs: SetLog[];
}

export interface SetLog {
  id: string;
  exerciseLogId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  wasSkipped?: boolean;
  wasAlternative?: boolean;
  alternativeExerciseId?: string | null;
  rpe: number | null;
  notes: string | null;
  completedAt: string;
}

export interface BodyMetric {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  notes: string | null;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: string;
  cloudinaryUrl: string;
  type: string;
  notes: string | null;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  estimated1rm: number;
  achievedAt: string;
  exercise: Exercise;
}

export interface OnboardingData {
  gender: "MALE" | "FEMALE" | "OTHER";
  goal: "MUSCLE_GAIN" | "WEIGHT_LOSS" | "GET_FIT" | "MAINTAIN";
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  daysAvailable: number;
  equipmentAccess: "FULL_GYM" | "HOME" | "LIMITED";
  currentWeight: number;
  height: number;
  sleepHours: number;
  dateOfBirth?: string;
  splitId?: string;
}

export interface WorkoutSummary {
  totalVolume: number;
  totalSets: number;
  exercisesCompleted: number;
  newPRs: PersonalRecord[];
}

export interface ProgressOverview {
  totalWorkouts: number;
  totalPRs: number;
  currentStreak: number;
  thisWeekWorkouts: number;
  currentWeight: number | null;
  goal: string | null;
}

export interface ExerciseProgress {
  date: string;
  sessionId: string;
  totalVolume: number;
  maxWeight: number;
  totalReps: number;
  sets: number;
}

export interface MuscleVolume {
  muscleGroup: string;
  volume: number;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface ExerciseQueueItem {
  id: string;
  splitDayExerciseId?: string;
  exercise: Exercise;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  loggedSets: SetLog[];
  status: 'pending' | 'in_progress' | 'complete' | 'skipped';
  wasReplaced: boolean;
  replacedWithExerciseId: string | null;
  notes?: string;
}

export interface ActiveSession {
  sessionId: string;
  splitDayId: string;
  splitDayName: string;
  splitName: string;
  dayNumber: number;
  totalDays: number;
  startedAt: number;
  exerciseQueue: ExerciseQueueItem[];
  currentExerciseIndex: number;
  currentSetNumber: number;
  isRestTimerActive: boolean;
  restStartedAt: number | null;
  notes: string;
  hasStarted: boolean;
}

export interface CalendarSession {
  id: string;
  date: string;
  status: string;
  splitDayName: string;
  muscleGroups: string;
  restReason: string | null;
  durationMinutes: number | null;
  exerciseCount: number;
  totalVolume: number;
  notes: string | null;
  exerciseLogs?: {
    id: string;
    exerciseName: string;
    sets: {
      id: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
    }[];
  }[];
}
