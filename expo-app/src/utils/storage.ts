import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const TOKEN_KEY = "auth_token";
export const USER_KEY = "user_profile";
export const ACTIVE_SPLIT_KEY = "active_split";
export const PENDING_SESSIONS_KEY = "pending_sessions";

export const saveToken = async (token: string) => {
  storage.set(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return storage.getString(TOKEN_KEY) || null;
};

export const saveUser = (user: any) => {
  storage.set(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const raw = storage.getString(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const saveActiveSplit = (split: any) => {
  storage.set(ACTIVE_SPLIT_KEY, JSON.stringify(split));
};

export const getActiveSplit = () => {
  const raw = storage.getString(ACTIVE_SPLIT_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const addToPendingQueue = (key: string, data: any) => {
  const raw = storage.getString(PENDING_SESSIONS_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ key, data, timestamp: Date.now() });
  storage.set(PENDING_SESSIONS_KEY, JSON.stringify(queue));
};

export const getPendingQueue = () => {
  const raw = storage.getString(PENDING_SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const clearPendingQueue = () => {
  storage.delete(PENDING_SESSIONS_KEY);
};

export const clearAuth = async () => {
  storage.delete(TOKEN_KEY);
  storage.delete(USER_KEY);
};

export const clearAll = () => {
  storage.clearAll();
};

export default storage;
