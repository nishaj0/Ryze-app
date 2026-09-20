import { describe, it, expect } from "vitest";
import {
  COLORS,
  FONTS,
  SPACING,
  RADII,
  LAYOUT,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  WORKOUT_CONSTANTS,
  ANALYTICS_CONSTANTS,
  API_TIMEOUTS,
  STORAGE_KEYS,
} from "./index";

describe("expo-app centralized constants", () => {
  it("should export well-formed design token colors", () => {
    expect(COLORS.terracotta.DEFAULT).toBe("#c24914");
    expect(COLORS.chalk.bg).toBe("#fcf9f3");
    expect(COLORS.ink.headline).toBe("#1a1917");
    expect(COLORS.border.DEFAULT).toBe("#dcdad4");
    expect(COLORS.forest.DEFAULT).toBe("#2d6a4f");
  });

  it("should export valid typography font families", () => {
    expect(FONTS.bold).toBe("Outfit-Bold");
    expect(FONTS.semiBold).toBe("Outfit-SemiBold");
    expect(FONTS.medium).toBe("Outfit-Medium");
    expect(FONTS.regular).toBe("Outfit-Regular");
    expect(FONTS.body).toBe("Inter");
  });

  it("should export spacing, radii, and layout tokens", () => {
    expect(SPACING.md).toBe(16);
    expect(RADII.lg).toBe(16);
    expect(LAYOUT.minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  it("should export all 17 anatomical muscle groups", () => {
    expect(MUSCLE_GROUPS.length).toBe(17);
    expect(MUSCLE_GROUPS).toContain("Chest");
    expect(MUSCLE_GROUPS).toContain("Lats");
    expect(MUSCLE_GROUPS).toContain("Quadriceps");
    expect(MUSCLE_GROUPS).toContain("Abdominals");
  });

  it("should export workout rule constants", () => {
    expect(WORKOUT_CONSTANTS.DELOAD_LOAD_FACTOR).toBe(0.70);
    expect(WORKOUT_CONSTANTS.DELOAD_PERCENT_LABEL).toBe("-30% LOAD");
    expect(WORKOUT_CONSTANTS.DEFAULT_REST_SECONDS).toBe(90);
    expect(WORKOUT_CONSTANTS.WEIGHT_STEP_KG).toBe(2.5);
    expect(WORKOUT_CONSTANTS.POSTURE_ANIMATION_INTERVAL_MS).toBe(1200);
    expect(WORKOUT_CONSTANTS.SEARCH_DEBOUNCE_MS).toBe(200);
  });

  it("should export analytics progression constants", () => {
    expect(ANALYTICS_CONSTANTS.DEFAULT_WEEKLY_VOLUME_KG).toBe(14850);
    expect(ANALYTICS_CONSTANTS.TARGET_SESSIONS_PER_WEEK).toBe(5);
    expect(ANALYTICS_CONSTANTS.VOLUME_HISTORY_WEEKS).toBe(8);
  });

  it("should export network timeouts and storage keys", () => {
    expect(API_TIMEOUTS.STANDARD).toBe(15000);
    expect(API_TIMEOUTS.AI).toBe(60000);
    expect(STORAGE_KEYS.AUTH_TOKEN).toBe("ryze_token");
    expect(STORAGE_KEYS.USER).toBe("ryze_user");
  });
});
