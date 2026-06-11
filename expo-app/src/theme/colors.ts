/**
 * Ryze Design System — Color Tokens
 * Light theme with Red/White primary palette
 * Inspired by Dashboard skill: clean, cloud-platform aesthetic, accessible
 */

export const colors = {
  // Primary brand (Red)
  primary: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
    950: "#450A0A",
  },

  // Neutral (Slate — for text, borders, surfaces)
  neutral: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },

  // Semantic
  success: {
    light: "#D1FAE5",
    DEFAULT: "#10B981",
    dark: "#047857",
  },
  warning: {
    light: "#FEF3C7",
    DEFAULT: "#F59E0B",
    dark: "#B45309",
  },
  danger: {
    light: "#FEE2E2",
    DEFAULT: "#EF4444",
    dark: "#991B1B",
  },
  info: {
    light: "#DBEAFE",
    DEFAULT: "#3B82F6",
    dark: "#1D4ED8",
  },
} as const;

const makeSemanticColor = (base: string, palette: { light: string; DEFAULT: string; dark: string }) => {
  const s = new String(base) as any;
  s.DEFAULT = palette.DEFAULT;
  s.light = palette.light;
  s.dark = palette.dark;
  return s as string & { DEFAULT: string; light: string; dark: string };
};

// Light theme semantic aliases
export const lightTheme = {
  // Backgrounds
  bg: colors.neutral[0],           // page background
  bgSurface: colors.neutral[50],   // section/alternate background
  bgElevated: colors.neutral[0],   // cards, modals
  bgOverlay: "rgba(15, 23, 42, 0.4)", // modal overlay

  // Text
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[500],
  textMuted: colors.neutral[400],
  textInverse: colors.neutral[0],
  textPlaceholder: colors.neutral[400],

  // Borders
  border: colors.neutral[200],
  borderFocus: colors.primary[600],
  borderError: colors.danger.DEFAULT,

  // Surfaces
  surface: colors.neutral[0],
  surfaceSecondary: colors.neutral[50],
  surfaceTertiary: colors.neutral[100],
  surfaceDisabled: colors.neutral[100],

  // Primary actions
  primary: colors.primary[600],
  primaryHover: colors.primary[700],
  primaryActive: colors.primary[800],
  primaryLight: colors.primary[50],
  primaryText: colors.neutral[0],

  // Secondary actions
  secondary: colors.neutral[100],
  secondaryHover: colors.neutral[200],
  secondaryActive: colors.neutral[300],
  secondaryText: colors.neutral[700],

  // States
  disabled: colors.neutral[200],
  disabledText: colors.neutral[400],
  error: colors.danger.DEFAULT,
  errorBg: colors.danger.light,
  errorText: colors.danger.dark,
  success: makeSemanticColor(colors.success.DEFAULT, colors.success),
  successBg: colors.success.light,
  successText: colors.success.dark,
  warning: colors.warning.DEFAULT,
  warningBg: colors.warning.light,
  warningText: colors.warning.dark,
  danger: makeSemanticColor(colors.danger.DEFAULT, colors.danger),

  // Input
  inputBg: colors.neutral[0],
  inputBorder: colors.neutral[200],
  inputBorderFocus: colors.primary[600],
  inputText: colors.neutral[900],
  inputPlaceholder: colors.neutral[400],

  // Shadows
  shadowSm: "rgba(0, 0, 0, 0.04)",
  shadowMd: "rgba(0, 0, 0, 0.08)",
  shadowLg: "rgba(0, 0, 0, 0.12)",
  shadowXl: "rgba(0, 0, 0, 0.16)",
} as const;

export type Colors = typeof colors;
export type LightTheme = typeof lightTheme;
