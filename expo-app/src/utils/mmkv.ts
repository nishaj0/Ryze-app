import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

let cache: Record<string, string> = {};
let initialized = false;

export const initMMKV = async () => {
  if (initialized) return;
  try {
    if (Platform.OS === "web") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          cache[key] = localStorage.getItem(key) || "";
        }
      }
    } else {
      // Load the active session key from secure storage on native platforms
      const activeSession = await SecureStore.getItemAsync("active_session");
      if (activeSession) {
        cache["active_session"] = activeSession;
      }
    }
  } catch (e) {
    console.error("Failed to initialize MMKV mock:", e);
  }
  initialized = true;
};

export const mmkv = {
  set: (key: string, value: string) => {
    cache[key] = value;
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      SecureStore.setItemAsync(key, value).catch((err) =>
        console.error("[MMKV] SecureStore write error:", err)
      );
    }
  },
  getString: (key: string): string | undefined => {
    return cache[key];
  },
  delete: (key: string) => {
    delete cache[key];
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      SecureStore.deleteItemAsync(key).catch((err) =>
        console.error("[MMKV] SecureStore delete error:", err)
      );
    }
  },
};
