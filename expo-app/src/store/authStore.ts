import { create } from "zustand";
import { User } from "../types";
import { saveToken, getToken, saveUser, getUser, clearAuth } from "../utils/storage";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: Partial<User>) => Promise<void>;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (token, user) => {
    await saveToken(token);
    await saveUser(user);
    set({ token, user: user as User, isAuthenticated: true, isLoading: false });
  },

  loadAuth: async () => {
    try {
      const token = await getToken();
      const user = await getUser();
      if (token && user) {
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("[authStore] loadAuth failed:", err);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await clearAuth();
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
