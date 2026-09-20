/**
 * Global Color Design Tokens for Ryze
 * Single source of truth for UI palettes, theme colors, and semantic status indicators.
 */

export const COLORS = {
  // Brand Terracotta Palette
  terracotta: {
    DEFAULT: "#c24914",
    light: "#fbeee8",
    dark: "#9b380e",
    hover: "#d3541c",
  },

  // Chalk Background & Surface Hierarchy
  chalk: {
    bg: "#fcf9f3",
    card: "#ffffff",
    subtle: "#f6f3ed",
    surface: "#f8f5ee",
  },

  // Ink Typography Hierarchy
  ink: {
    headline: "#1a1917",
    body: "#49453a",
    muted: "#7a766c",
    faint: "#b5b2a9",
  },

  // Borders & Dividers
  border: {
    DEFAULT: "#dcdad4",
    dark: "#c8c6be",
    light: "#ebe8e1",
    focus: "#c24914",
  },

  // Accent & Status Colors
  forest: {
    DEFAULT: "#2d6a4f",
    subtle: "#e8f4ee",
    dark: "#1b4332",
  },
  gold: {
    DEFAULT: "#b8860b",
    subtle: "#faf3e0",
    dark: "#8a6508",
  },
  crimson: {
    DEFAULT: "#b91c1c",
    subtle: "#fee2e2",
    dark: "#7f1d1d",
  },
  amber: {
    DEFAULT: "#f4a261",
    subtle: "#fff3eb",
  },

  // Common Constants
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(26, 25, 23, 0.4)",
  overlayDark: "rgba(26, 25, 23, 0.75)",
} as const;

export type ColorTokens = typeof COLORS;
