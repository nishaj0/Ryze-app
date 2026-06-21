import { mmkv } from "../utils/mmkv";
import { lightTheme, darkTheme, Theme } from "./colors";

type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "theme_mode";

function getStoredMode(): ThemeMode {
  const stored = mmkv.getString(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "light";
}

function getTheme(mode: ThemeMode): Theme {
  if (mode === "dark") return darkTheme;
  return lightTheme;
}

let currentMode: ThemeMode = getStoredMode();
let currentTheme: Theme = getTheme(currentMode);

export function getThemeState() {
  return { mode: currentMode, theme: currentTheme };
}

export function setThemeMode(mode: ThemeMode) {
  currentMode = mode;
  currentTheme = getTheme(mode);
  mmkv.set(THEME_KEY, mode);
}

export function toggleThemeMode() {
  setThemeMode(currentMode === "dark" ? "light" : "dark");
}

// Simple getter - no hooks needed
export function useTheme(): Theme {
  return currentTheme;
}

export function useThemeMode() {
  return {
    mode: currentMode,
    setMode: setThemeMode,
    toggleMode: toggleThemeMode,
  };
}
