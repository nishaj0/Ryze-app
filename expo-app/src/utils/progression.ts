import { SetLog, Exercise } from "../types";

const getWeightIncrement = (equipment: string, name: string): number => {
  const eq = (equipment || "").toLowerCase();
  const nm = (name || "").toLowerCase();
  if (eq.includes("barbell")) return 2.5;
  if (eq.includes("dumbbell")) return 2.0;
  if (eq.includes("machine")) return 5.0;
  if (eq.includes("cable")) return 2.5;

  if (nm.includes("barbell")) return 2.5;
  if (nm.includes("dumbbell")) return 2.0;
  if (nm.includes("cable")) return 2.5;
  if (nm.includes("machine")) return 5.0;
  return 2.5; // default fallback
};

export interface RecommendationResult {
  recommendedWeight: number | null;
  recommendedReps: number | null;
  lastWeight: number | null;
  lastReps: number | null;
}

export function getSetRecommendation(
  exercise: Exercise,
  repMin: number,
  repMax: number,
  history: any[] // array of ExerciseLog/SetLogs or SetLogs sorted desc
): RecommendationResult {
  // Extract set logs from history. If history is array of ExerciseLogs, flatten setLogs.
  // If history is flat array of SetLogs, use directly.
  let flatSets: any[] = [];
  if (history && history.length > 0) {
    if (history[0].setLogs) {
      // It is an array of ExerciseLogs
      history.forEach((log) => {
        if (log.setLogs) {
          log.setLogs.forEach((set: any) => {
            flatSets.push({
              ...set,
              exerciseLogId: log.id,
              completedAt: set.completedAt || log.session?.date || new Date().toISOString(),
            });
          });
        }
      });
    } else {
      // It is already a flat list of SetLogs
      flatSets = history;
    }
  }

  // Sort desc by completedAt (or ID if completedAt isn't present)
  flatSets.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  // Filter out skipped/invalid sets
  const validHistory = flatSets.filter(
    (h) => !h.was_skipped && h.weightKg !== null && h.reps !== null
  );

  if (validHistory.length === 0) {
    return {
      recommendedWeight: null,
      recommendedReps: null,
      lastWeight: null,
      lastReps: null,
    };
  }

  // Get unique exerciseLogIds in validHistory (each represents one session's training of the exercise)
  const sessionLogIds: string[] = [];
  validHistory.forEach((h) => {
    if (h.exerciseLogId && !sessionLogIds.includes(h.exerciseLogId)) {
      sessionLogIds.push(h.exerciseLogId);
    }
  });

  const getBestSet = (sets: any[]) => {
    if (sets.length === 0) return null;
    let best = sets[0];
    for (const s of sets) {
      if (
        s.weightKg > best.weightKg ||
        (s.weightKg === best.weightKg && s.reps > best.reps)
      ) {
        best = s;
      }
    }
    return best;
  };

  // 1. Most recent session sets
  const recentSessionSets = validHistory.filter(
    (h) => h.exerciseLogId === sessionLogIds[0]
  );
  const bestRecent = getBestSet(recentSessionSets);

  // 2. Second most recent session sets
  const secondRecentSessionSets = sessionLogIds[1]
    ? validHistory.filter((h) => h.exerciseLogId === sessionLogIds[1])
    : [];
  const bestSecond = getBestSet(secondRecentSessionSets);

  // 3. Take the HIGHER best set between last two sessions
  let bestSet = bestRecent;
  if (bestRecent && bestSecond) {
    const rVal = bestRecent.weightKg * 1000 + bestRecent.reps;
    const sVal = bestSecond.weightKg * 1000 + bestSecond.reps;
    if (sVal > rVal) {
      bestSet = bestSecond;
    }
  }

  if (!bestSet) {
    return {
      recommendedWeight: null,
      recommendedReps: null,
      lastWeight: null,
      lastReps: null,
    };
  }

  const lastWeight = bestRecent ? bestRecent.weightKg : null;
  const lastReps = bestRecent ? bestRecent.reps : null;

  // 4. Apply progressive overload rule
  let recommendedWeight = bestSet.weightKg;
  let recommendedReps = bestSet.reps;

  // Get weight increment
  const increment = getWeightIncrement(exercise.equipment || "", exercise.name);

  if (bestSet.reps < repMin) {
    // reps < repMin → same weight, same reps (still building)
    recommendedWeight = bestSet.weightKg;
    recommendedReps = bestSet.reps;
  } else if (bestSet.reps >= repMin && bestSet.reps < repMax) {
    // repMin ≤ reps < repMax → same weight, reps + 2
    recommendedWeight = bestSet.weightKg;
    recommendedReps = Math.min(bestSet.reps + 2, repMax);
  } else if (bestSet.reps >= repMax) {
    // reps ≥ repMax → weight + increment, reps = repMin
    recommendedWeight = bestSet.weightKg + increment;
    recommendedReps = repMin;
  }

  return {
    recommendedWeight,
    recommendedReps,
    lastWeight,
    lastReps,
  };
}
