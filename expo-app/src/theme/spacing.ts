/**
 * Spacing Tokens — 8pt baseline grid
 * Dashboard skill: consistent rhythm, predictable layouts
 */

export const spacing = {
  // Base scale
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

// Semantic aliases
export const space = {
  xs: spacing[1],   // 4
  sm: spacing[2],   // 8
  md: spacing[4],   // 16
  lg: spacing[6],   // 24
  xl: spacing[8],   // 32
  "2xl": spacing[10], // 40
  "3xl": spacing[12], // 48
  "4xl": spacing[16], // 64
} as const;

// Border radius
export const radius = {
  none: 0,
  sm: 6,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

// Touch target minimum
export const touchTarget = 44;
