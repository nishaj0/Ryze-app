import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const TOKEN_KEY = "auth_token";
export const USER_KEY = "user_profile";
export const ACTIVE_SPLIT_KEY = "active_split";
export const PENDING_SESSIONS_KEY = "pending_sessions";

export const saveToken = async (token: string) => {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveUser = async (user: any) => {
  const value = JSON.stringify(user);
  if (Platform.OS === "web") {
    localStorage.setItem(USER_KEY, value);
  } else {
    await SecureStore.setItemAsync(USER_KEY, value);
  }
};

export const getUser = async () => {
  let raw = null;
  if (Platform.OS === "web") {
    raw = localStorage.getItem(USER_KEY);
  } else {
    raw = await SecureStore.getItemAsync(USER_KEY);
  }
  return raw ? JSON.parse(raw) : null;
};

export const saveActiveSplit = async (split: any) => {
  const value = JSON.stringify(split);
  if (Platform.OS === "web") {
    localStorage.setItem(ACTIVE_SPLIT_KEY, value);
  } else {
    await SecureStore.setItemAsync(ACTIVE_SPLIT_KEY, value);
  }
};

export const getActiveSplit = async () => {
  let raw = null;
  if (Platform.OS === "web") {
    raw = localStorage.getItem(ACTIVE_SPLIT_KEY);
  } else {
    raw = await SecureStore.getItemAsync(ACTIVE_SPLIT_KEY);
  }
  return raw ? JSON.parse(raw) : null;
};

export const addToPendingQueue = async (key: string, data: any) => {
  let raw = null;
  if (Platform.OS === "web") {
    raw = localStorage.getItem(PENDING_SESSIONS_KEY);
  } else {
    raw = await SecureStore.getItemAsync(PENDING_SESSIONS_KEY);
  }
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ key, data, timestamp: Date.now() });
  
  const value = JSON.stringify(queue);
  if (Platform.OS === "web") {
    localStorage.setItem(PENDING_SESSIONS_KEY, value);
  } else {
    await SecureStore.setItemAsync(PENDING_SESSIONS_KEY, value);
  }
};

export const getPendingQueue = async () => {
  let raw = null;
  if (Platform.OS === "web") {
    raw = localStorage.getItem(PENDING_SESSIONS_KEY);
  } else {
    raw = await SecureStore.getItemAsync(PENDING_SESSIONS_KEY);
  }
  return raw ? JSON.parse(raw) : [];
};

export const clearPendingQueue = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(PENDING_SESSIONS_KEY);
  } else {
    await SecureStore.deleteItemAsync(PENDING_SESSIONS_KEY);
  }
};

export const clearAuth = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
};

export const clearAll = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_SPLIT_KEY);
    localStorage.removeItem(PENDING_SESSIONS_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(ACTIVE_SPLIT_KEY);
    await SecureStore.deleteItemAsync(PENDING_SESSIONS_KEY);
  }
};

// Back-compat default export
const storage = {
  set: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getString: async (key: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  delete: async (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default storage;
