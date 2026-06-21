import { create } from "zustand";
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

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialMode = getStoredMode();
  return {
    mode: initialMode,
    theme: getTheme(initialMode),
    setMode: (mode) => {
      mmkv.set(THEME_KEY, mode);
      set({ mode, theme: getTheme(mode) });
    },
    toggleMode: () => {
      set((state) => {
        const newMode = state.mode === "dark" ? "light" : "dark";
        mmkv.set(THEME_KEY, newMode);
        return { mode: newMode, theme: getTheme(newMode) };
      });
    },
  };
});

export function getThemeState() {
  const state = useThemeStore.getState();
  return { mode: state.mode, theme: state.theme };
}

export function setThemeMode(mode: ThemeMode) {
  useThemeStore.getState().setMode(mode);
}

export function toggleThemeMode() {
  useThemeStore.getState().toggleMode();
}

export function useTheme(): Theme {
  return useThemeStore((state) => state.theme);
}

export function useThemeMode() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  return { mode, setMode, toggleMode };
}

