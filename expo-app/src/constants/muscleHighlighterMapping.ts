import type { Slug } from "react-native-body-highlighter";

export type MuscleHighlightSlug = Slug;
export type BodyView = "front" | "back";
export type SlugSide = BodyView | "both";

export interface MuscleHighlightData {
  slug: MuscleHighlightSlug;
  intensity: number;
  side?: "left" | "right";
}

export interface MuscleVolumeEntry {
  muscleGroup: string;
  volume: number;
}

export const muscleHighlighterMapping: Record<string, readonly MuscleHighlightSlug[]> = {
  abdominals: ["abs"],
  // The shipped v3.2 SVG has no abductor region; gluteal is the closest posterior hip approximation.
  abductors: ["gluteal"],
  adductors: ["adductors"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  // The highlighter does not distinguish lats from the broader upper-back region.
  lats: ["upper-back"],
  "lower back": ["lower-back"],
  // The highlighter does not distinguish middle back from the broader upper-back region.
  "middle back": ["upper-back"],
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  shoulders: ["deltoids"],
  traps: ["trapezius"],
  triceps: ["triceps"],
};

export const slugSide: Record<MuscleHighlightSlug, SlugSide> = {
  abs: "front",
  adductors: "both",
  ankles: "both",
  biceps: "front",
  calves: "both",
  chest: "front",
  deltoids: "both",
  feet: "both",
  forearm: "both",
  gluteal: "back",
  hamstring: "back",
  hands: "both",
  hair: "both",
  head: "both",
  knees: "front",
  "lower-back": "back",
  neck: "both",
  obliques: "front",
  quadriceps: "front",
  tibialis: "front",
  trapezius: "both",
  triceps: "both",
  "upper-back": "back",
};

export function getMuscleHighlightData(
  ourMuscleNames: readonly string[],
  intensity: number = 1
): MuscleHighlightData[] {
  const highlights = new Map<MuscleHighlightSlug, MuscleHighlightData>();

  for (const muscleName of ourMuscleNames) {
    const normalizedName = muscleName.trim().toLowerCase();
    const slugs = muscleHighlighterMapping[normalizedName];

    if (!slugs) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn(`[muscleHighlighter] Unmapped muscle: ${muscleName}`);
      }
      continue;
    }

    for (const slug of slugs) {
      const existing = highlights.get(slug);
      if (!existing || intensity > existing.intensity) {
        highlights.set(slug, { slug, intensity });
      }
    }
  }

  return [...highlights.values()];
}

export function isSlugVisibleOnSide(slug: MuscleHighlightSlug, side: BodyView) {
  return slugSide[slug] === "both" || slugSide[slug] === side;
}

export function getWeeklyVolumeHighlightData(volumes: readonly MuscleVolumeEntry[]): MuscleHighlightData[] {
  const maximumVolume = Math.max(...volumes.map((item) => item.volume), 0);
  const highlights = new Map<MuscleHighlightSlug, MuscleHighlightData>();

  for (const muscleVolume of volumes) {
    if (muscleVolume.volume <= 0 || maximumVolume <= 0) continue;
    const intensity = muscleVolume.volume / maximumVolume >= 0.6 ? 2 : 1;

    for (const highlight of getMuscleHighlightData([muscleVolume.muscleGroup], intensity)) {
      const existing = highlights.get(highlight.slug);
      if (!existing || highlight.intensity > existing.intensity) {
        highlights.set(highlight.slug, highlight);
      }
    }
  }

  return [...highlights.values()];
}
