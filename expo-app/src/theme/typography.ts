/**
 * Typography Tokens
 * Dashboard skill: clean scale, clear hierarchy, readable at all sizes
 * Using Inter (loaded via @expo-google-fonts/inter)
 */

export const fontFamily = {
  primary: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
  mono: "Courier",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const fontWeight = {
  thin: "100",
  extraLight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extraBold: "800",
  black: "900",
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Semantic typography — maps to loaded font families
const familyFor = (weight: string): string => {
  if (weight === "500") return fontFamily.medium;
  if (weight === "600") return fontFamily.semibold;
  if (weight === "700") return fontFamily.bold;
  if (weight === "800" || weight === "900") return fontFamily.extrabold;
  return fontFamily.primary;
};

// Semantic typography
export const typography = {
  // Display
  display: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    fontFamily: fontFamily.bold,
  },
  heading1: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    fontFamily: fontFamily.bold,
  },
  heading2: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    fontFamily: fontFamily.semibold,
  },
  heading3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    fontFamily: fontFamily.semibold,
  },
  // Body
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    fontFamily: fontFamily.primary,
  },
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    fontFamily: fontFamily.primary,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    fontFamily: fontFamily.primary,
  },
  // UI
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    fontFamily: fontFamily.medium,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    fontFamily: fontFamily.primary,
  },
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    fontFamily: fontFamily.semibold,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    fontFamily: fontFamily.semibold,
  },
} as const;

export { familyFor };
