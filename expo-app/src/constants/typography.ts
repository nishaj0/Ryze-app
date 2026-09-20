/**
 * Global Typography & Font Family Constants for Ryze
 */

export const FONTS = {
  // Display & Headings (Outfit)
  bold: "Outfit-Bold",
  semiBold: "Outfit-SemiBold",
  medium: "Outfit-Medium",
  regular: "Outfit-Regular",

  // Aliases for clear semantic usage
  headingBold: "Outfit-Bold",
  headingSemiBold: "Outfit-SemiBold",
  headingMedium: "Outfit-Medium",
  headingRegular: "Outfit-Regular",

  // Body & Numerical (Inter)
  body: "Inter",
  bodyMedium: "Inter-Medium",
  bodyBold: "Inter-Bold",

  // Monospace
  mono: "Courier",
} as const;

export const FONT_SIZES = {
  xxs: 10,
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  display: 40,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.5,
  loose: 1.7,
} as const;
