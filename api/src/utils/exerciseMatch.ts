export interface CandidateExercise {
  id: string;
  name: string;
  equipment: string | null;
  level: string | null;
  muscles: { isPrimary: boolean; muscle: { name: string } }[];
}

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[\u002D\u2013\u2014]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildExerciseMaps(exercises: CandidateExercise[]) {
  return {
    exactMap: new Map<string, CandidateExercise>(exercises.map((ex) => [ex.name, ex])),
    caseInsensitiveMap: new Map<string, CandidateExercise>(exercises.map((ex) => [ex.name.toLowerCase(), ex])),
    normalizedMap: new Map<string, CandidateExercise>(exercises.map((ex) => [normalizeExerciseName(ex.name), ex])),
  };
}

export function resolveExercise(
  exerciseName: string,
  exactMap: Map<string, CandidateExercise>,
  caseInsensitiveMap: Map<string, CandidateExercise>,
  normalizedMap: Map<string, CandidateExercise>
): CandidateExercise | undefined {
  const exact = exactMap.get(exerciseName);
  if (exact) return exact;

  const ci = caseInsensitiveMap.get(exerciseName.toLowerCase());
  if (ci) return ci;

  const norm = normalizedMap.get(normalizeExerciseName(exerciseName));
  if (norm) return norm;

  return undefined;
}

export function findPartialMatches(
  exerciseName: string,
  exercises: CandidateExercise[]
): CandidateExercise[] {
  const normalized = normalizeExerciseName(exerciseName);
  const lower = exerciseName.toLowerCase();
  return exercises.filter((ex) => {
    const exLower = ex.name.toLowerCase();
    const exNorm = normalizeExerciseName(ex.name);
    return exLower.includes(lower) || exNorm.includes(normalized) || lower.includes(exLower) || normalized.includes(exNorm);
  });
}
