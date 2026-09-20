/**
 * Global Spacing, Layout, and Radii Constants for Ryze
 */

export const SPACING = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const RADII = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const LAYOUT = {
  minTouchTarget: 44,
  headerHeight: 56,
  bottomBarHeight: 70,
  cardRadius: 16,
  pillRadius: 9999,
  modalMaxHeightPercentage: 0.9,
} as const;
