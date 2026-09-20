import { describe, it, expect } from "vitest";

describe("Exercise Browser Filtering Logic", () => {
  const sampleExercises = [
    { id: "1", name: "Barbell Bench Press", category: "Chest", equipment: "barbell", mechanic: "Compound" },
    { id: "2", name: "Dumbbell Incline Press", category: "Chest", equipment: "dumbbell", mechanic: "Compound" },
    { id: "3", name: "Cable Fly", category: "Chest", equipment: "cable", mechanic: "Isolation" },
    { id: "4", name: "Barbell Squat", category: "Quads", equipment: "barbell", mechanic: "Compound" },
    { id: "5", name: "Lat Pulldown", category: "Lats", equipment: "cable", mechanic: "Compound" },
  ];

  it("should filter exercises by muscle category", () => {
    const chestExercises = sampleExercises.filter((e) => e.category === "Chest");
    expect(chestExercises).toHaveLength(3);
  });

  it("should filter exercises by search query across name, category, and equipment", () => {
    const filterExercises = (query: string) => {
      const q = query.toLowerCase();
      return sampleExercises.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.equipment.toLowerCase().includes(q)
      );
    };

    expect(filterExercises("barbell")).toHaveLength(2);
    expect(filterExercises("cable")).toHaveLength(2);
    expect(filterExercises("squat")).toHaveLength(1);
    expect(filterExercises("nonexistent")).toHaveLength(0);
  });
});

describe("Rest Day & Recovery Protocol Logic", () => {
  it("should clamp hydration stepping within safe bounds (0.0L to 6.0L)", () => {
    const stepHydration = (current: number, delta: number) => {
      return Math.max(0, Math.min(6.0, Math.round((current + delta) * 10) / 10));
    };

    expect(stepHydration(2.8, 0.25)).toBe(3.1);
    expect(stepHydration(0.1, -0.5)).toBe(0);
    expect(stepHydration(5.9, 0.5)).toBe(6.0);
  });

  it("should calculate days between check-in photos for Physique Vault", () => {
    const date1 = "2026-06-01T10:00:00.000Z";
    const date2 = "2026-08-24T10:00:00.000Z";

    const days = Math.abs(
      Math.round((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24))
    );
    expect(days).toBe(84);
  });
});

describe("Program Library Active Split Switching", () => {
  it("should switch active split while setting others to inactive", () => {
    const splits = [
      { id: "us-1", splitId: "s-1", name: "PPL", isActive: true },
      { id: "us-2", splitId: "s-2", name: "Full Body", isActive: false },
      { id: "us-3", splitId: "s-3", name: "Upper Lower", isActive: false },
    ];

    const targetSplitId = "s-2";
    const updated = splits.map((s) => ({
      ...s,
      isActive: s.splitId === targetSplitId,
    }));

    expect(updated.find((s) => s.splitId === "s-1")?.isActive).toBe(false);
    expect(updated.find((s) => s.splitId === "s-2")?.isActive).toBe(true);
    expect(updated.find((s) => s.splitId === "s-3")?.isActive).toBe(false);
  });
});
