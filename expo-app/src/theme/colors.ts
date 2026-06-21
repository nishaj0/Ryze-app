/**
 * Ryze Design System — Color Tokens
 * Light: "Chalk" — warm concrete, rust orange accents
 * Dark: "Iron" — near-black warm, ember accents
 */

// Raw color values
export const chalk = {
  bg: "#F2EFE9",
  surface: "#FFFFFF",
  ink: "#1C1B19",
  muted: "#6B665E",
  accent: "#C24914",
  accentSoft: "#E8D9C7",
  line: "#DDD7CC",
  success: "#3D6B47",
  danger: "#A23B2E",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  successBg: "#D1FAE5",
  successText: "#047857",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
  overlay: "rgba(28, 27, 25, 0.4)",
  shadowSm: "rgba(0, 0, 0, 0.04)",
  shadowMd: "rgba(0, 0, 0, 0.08)",
  shadowLg: "rgba(0, 0, 0, 0.12)",
  shadowXl: "rgba(0, 0, 0, 0.16)",
} as const;

export const iron = {
  bg: "#161513",
  surface: "#211F1C",
  ink: "#EDE8DF",
  muted: "#A8A196",
  accent: "#E8631F",
  accentSoft: "#3A2A1E",
  line: "#332F2A",
  success: "#5FA86C",
  danger: "#C2543F",
  warning: "#F59E0B",
  warningBg: "#3A2A1E",
  successBg: "#1A3A22",
  successText: "#5FA86C",
  dangerBg: "#3A1E18",
  dangerText: "#E8856F",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadowSm: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
  shadowLg: "rgba(0, 0, 0, 0.4)",
  shadowXl: "rgba(0, 0, 0, 0.5)",
} as const;

export type ThemePalette = typeof chalk;

// Theme type — both palettes share the same shape
export interface Theme {
  bg: string;
  bgSurface: string;
  bgElevated: string;
  bgOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textPlaceholder: string;
  border: string;
  borderFocus: string;
  borderError: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceDisabled: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryText: string;
  disabled: string;
  disabledText: string;
  error: string;
  errorBg: string;
  errorText: string;
  success: string;
  successBg: string;
  successText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  danger: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputText: string;
  inputPlaceholder: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
}

function buildTheme(palette: { bg: string; surface: string; ink: string; muted: string; accent: string; accentSoft: string; line: string; success: string; danger: string; warning: string; warningBg: string; successBg: string; successText: string; dangerBg: string; dangerText: string; overlay: string; shadowSm: string; shadowMd: string; shadowLg: string; shadowXl: string }, isDark: boolean): Theme {
  return {
    bg: palette.bg,
    bgSurface: isDark ? "#1C1A17" : "#F8F5F0",
    bgElevated: palette.surface,
    bgOverlay: palette.overlay,
    textPrimary: palette.ink,
    textSecondary: palette.muted,
    textMuted: isDark ? "#8A8276" : "#94A3B8",
    textInverse: isDark ? palette.bg : palette.ink,
    textPlaceholder: palette.muted,
    border: palette.line,
    borderFocus: palette.accent,
    borderError: palette.danger,
    surface: palette.surface,
    surfaceSecondary: isDark ? "#2A2723" : "#F8F5F0",
    surfaceTertiary: isDark ? "#332F2A" : "#EDE8DF",
    surfaceDisabled: isDark ? "#2A2723" : "#E2E8F0",
    primary: palette.accent,
    primaryHover: isDark ? "#F07030" : "#A83D10",
    primaryActive: isDark ? "#F58040" : "#8B3210",
    primaryLight: palette.accentSoft,
    primaryText: isDark ? "#FFFFFF" : "#FFFFFF",
    secondary: isDark ? "#2A2723" : "#F1F5F9",
    secondaryHover: isDark ? "#332F2A" : "#E2E8F0",
    secondaryActive: isDark ? "#3A3530" : "#CBD5E1",
    secondaryText: isDark ? "#EDE8DF" : "#334155",
    disabled: isDark ? "#332F2A" : "#E2E8F0",
    disabledText: isDark ? "#736C63" : "#94A3B8",
    error: palette.danger,
    errorBg: palette.dangerBg,
    errorText: palette.dangerText,
    success: palette.success,
    successBg: palette.successBg,
    successText: palette.successText,
    warning: palette.warning,
    warningBg: palette.warningBg,
    warningText: isDark ? "#F59E0B" : "#B45309",
    danger: palette.danger,
    inputBg: palette.surface,
    inputBorder: palette.line,
    inputBorderFocus: palette.accent,
    inputText: palette.ink,
    inputPlaceholder: palette.muted,
    shadowSm: palette.shadowSm,
    shadowMd: palette.shadowMd,
    shadowLg: palette.shadowLg,
    shadowXl: palette.shadowXl,
  };
}

export const lightTheme: Theme = buildTheme(chalk, false);
export const darkTheme: Theme = buildTheme(iron, true);

export const colors = { chalk, iron };

export type LightTheme = Theme;
