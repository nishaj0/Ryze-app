import { describe, it, expect } from "vitest";
import { MuscleVolume } from "../../types";

describe("Analytics Volume & Progressive Overload Calculations", () => {
  const sampleVolumes: MuscleVolume[] = [
    { muscle: "Chest", volume: 4800, sets: 12 },
    { muscle: "Shoulders", volume: 3200, sets: 8 },
    { muscle: "Lats", volume: 3800, sets: 10 },
    { muscle: "Quads", volume: 3050, sets: 8 },
  ];

  it("should sum total weekly muscle volume correctly", () => {
    const total = sampleVolumes.reduce((sum, m) => sum + m.volume, 0);
    expect(total).toBe(14850);
  });

  it("should calculate muscle intensity percentage relative to peak", () => {
    const maxVol = Math.max(...sampleVolumes.map((m) => m.volume), 1);
    expect(maxVol).toBe(4800);

    const chestRatio = sampleVolumes[0].volume / maxVol;
    expect(chestRatio).toBe(1.0);

    const shoulderRatio = sampleVolumes[1].volume / maxVol;
    expect(Math.round(shoulderRatio * 100)).toBe(67);
  });

  it("should map volume intensity to correct terracotta shade scale", () => {
    const getShade = (ratio: number) => {
      if (ratio > 0.8) return "#a83e0f"; // peak
      if (ratio > 0.5) return "#c24914"; // heavy
      if (ratio > 0.25) return "#f4a261"; // moderate
      if (ratio > 0.05) return "#fbeee8"; // low
      return "#dcdad4"; // minimal
    };

    expect(getShade(0.95)).toBe("#a83e0f");
    expect(getShade(0.67)).toBe("#c24914");
    expect(getShade(0.35)).toBe("#f4a261");
    expect(getShade(0.12)).toBe("#fbeee8");
    expect(getShade(0.01)).toBe("#dcdad4");
  });

  it("should calculate progressive overload bar height percentage", () => {
    const history = [
      { week: "W1", volume: 9200 },
      { week: "W2", volume: 10400 },
      { week: "W8", volume: 14800 },
    ];
    const max = Math.max(...history.map((w) => w.volume));
    expect(max).toBe(14800);

    const w1Pct = Math.round((history[0].volume / max) * 100);
    expect(w1Pct).toBe(62);

    const w8Pct = Math.round((history[2].volume / max) * 100);
    expect(w8Pct).toBe(100);
  });
});
