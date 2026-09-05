import { describe, expect, it, vi } from "vitest";
import {
  getMuscleHighlightData,
  getWeeklyVolumeHighlightData,
  isSlugVisibleOnSide,
  muscleHighlighterMapping,
  slugSide,
} from "./muscleHighlighterMapping";

describe("muscleHighlighterMapping", () => {
  it("maps every imported exercise muscle", () => {
    expect(Object.keys(muscleHighlighterMapping).sort()).toEqual([
      "abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms", "glutes",
      "hamstrings", "lats", "lower back", "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps",
    ]);
  });

  it("uses the documented upper-back approximations", () => {
    expect(getMuscleHighlightData(["lats", "middle back"])).toEqual([{ slug: "upper-back", intensity: 1 }]);
  });

  it("deduplicates mapped slugs and retains their highest intensity", () => {
    expect(getMuscleHighlightData(["chest", "chest"], 2)).toEqual([{ slug: "chest", intensity: 2 }]);
  });

  it("marks verified muscle-view availability correctly", () => {
    expect(slugSide.forearm).toBe("both");
    expect(muscleHighlighterMapping.abductors).toEqual(["gluteal"]);
    expect(isSlugVisibleOnSide("forearm", "front")).toBe(true);
    expect(isSlugVisibleOnSide("forearm", "back")).toBe(true);
    expect(isSlugVisibleOnSide("gluteal", "front")).toBe(false);
    expect(isSlugVisibleOnSide("gluteal", "back")).toBe(true);
  });

  it("skips unknown muscles with a development warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("__DEV__", true);
    expect(getMuscleHighlightData(["future muscle"])).toEqual([]);
    expect(warn).toHaveBeenCalledWith("[muscleHighlighter] Unmapped muscle: future muscle");
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it("assigns equal highest volumes the brighter intensity and smaller volumes the lighter one", () => {
    expect(getWeeklyVolumeHighlightData([
      { muscleGroup: "chest", volume: 1000 },
      { muscleGroup: "triceps", volume: 1000 },
      { muscleGroup: "biceps", volume: 500 },
      { muscleGroup: "calves", volume: 0 },
    ])).toEqual([
      { slug: "chest", intensity: 2 },
      { slug: "triceps", intensity: 2 },
      { slug: "biceps", intensity: 1 },
    ]);
  });
});
