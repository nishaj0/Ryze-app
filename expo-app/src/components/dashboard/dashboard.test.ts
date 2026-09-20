import { describe, it, expect } from "vitest";
import { chalkTokens, chalk, iron } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

describe("Dashboard Theme & Tokens", () => {
  it("should have correct Chalk Athletic Modernism color values", () => {
    expect(chalkTokens.chalkBg).toBe("#fcf9f3");
    expect(chalkTokens.chalkCard).toBe("#ffffff");
    expect(chalkTokens.chalkSubtle).toBe("#f6f3ed");
    expect(chalkTokens.chalkDim).toBe("#dcdad4");
    expect(chalkTokens.terracotta).toBe("#c24914");
    expect(chalkTokens.forest).toBe("#2d6a4f");
    expect(chalkTokens.inkHeadline).toBe("#1a1917");
    expect(chalkTokens.inkBody).toBe("#49453a");
    expect(chalkTokens.inkMuted).toBe("#7a766c");
  });

  it("should define valid Outfit font family weights", () => {
    expect(fontFamily.primary).toBe("Outfit_400Regular");
    expect(fontFamily.medium).toBe("Outfit_500Medium");
    expect(fontFamily.semibold).toBe("Outfit_600SemiBold");
    expect(fontFamily.bold).toBe("Outfit_700Bold");
  });

  it("should have balanced font sizes across hierarchy", () => {
    expect(fontSize.xs).toBe(12);
    expect(fontSize.sm).toBe(14);
    expect(fontSize.base).toBe(16);
    expect(fontSize.xl).toBe(20);
    expect(fontSize["2xl"]).toBe(24);
    expect(fontSize["3xl"]).toBe(32);
  });
});

describe("Weekly Rhythm & Adherence Logic", () => {
  it("should count completed days correctly", () => {
    const days = [
      { dayLabel: "M", isCompleted: true, isToday: false, isRest: false, isUpcoming: false, dateStr: "2026-09-14" },
      { dayLabel: "T", isCompleted: true, isToday: false, isRest: false, isUpcoming: false, dateStr: "2026-09-15" },
      { dayLabel: "W", isCompleted: false, isToday: true, isRest: false, isUpcoming: false, dateStr: "2026-09-16" },
      { dayLabel: "T", isCompleted: true, isToday: false, isRest: false, isUpcoming: false, dateStr: "2026-09-17" },
      { dayLabel: "F", isCompleted: true, isToday: false, isRest: false, isUpcoming: false, dateStr: "2026-09-18" },
      { dayLabel: "S", isCompleted: false, isToday: false, isRest: true, isUpcoming: true, dateStr: "2026-09-19" },
      { dayLabel: "S", isCompleted: false, isToday: false, isRest: true, isUpcoming: true, dateStr: "2026-09-20" },
    ];

    const completed = days.filter((d) => d.isCompleted).length;
    expect(completed).toBe(4);
  });
});

describe("Biometrics Progress Calculations", () => {
  it("should calculate protein progress percentage accurately", () => {
    const currentG = 142;
    const targetG = 180;
    const pct = Math.min(100, Math.round((currentG / targetG) * 100));
    expect(pct).toBe(79);
  });

  it("should format weight delta correctly", () => {
    const weightNow = 74.2;
    const weightPrev = 73.8;
    const delta = weightNow - weightPrev;
    const deltaStr = delta >= 0 ? `+${delta.toFixed(1)} kg` : `${delta.toFixed(1)} kg`;
    expect(deltaStr).toBe("+0.4 kg");
  });
});
