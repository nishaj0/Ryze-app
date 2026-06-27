import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/storage", () => ({
  saveToken: vi.fn(),
  getToken: vi.fn(),
  saveUser: vi.fn(),
  getUser: vi.fn(),
  clearAuth: vi.fn(),
}));

import { useAuthStore } from "../store/authStore";
import { saveToken, getToken, saveUser, getUser, clearAuth } from "../utils/storage";

const TEST_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  gender: null,
  goal: null,
  experienceLevel: null,
  daysAvailable: null,
  equipmentAccess: null,
  sleepHours: null,
  currentWeight: null,
  height: null,
  units: "kg" as const,
  onboardingDone: false,
  reminderTime: null,
  weeklyCheckin: true,
  createdAt: "2024-01-01",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  describe("setAuth", () => {
    it("should save token and user, then set state", async () => {
      await useAuthStore.getState().setAuth("test-token", TEST_USER);

      expect(saveToken).toHaveBeenCalledWith("test-token");
      expect(saveUser).toHaveBeenCalledWith(TEST_USER);
      expect(useAuthStore.getState().token).toBe("test-token");
      expect(useAuthStore.getState().user).toEqual(TEST_USER);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("loadAuth", () => {
    it("should set authenticated state if token and user exist", async () => {
      (getToken as any).mockResolvedValue("stored-token");
      (getUser as any).mockResolvedValue(TEST_USER);

      await useAuthStore.getState().loadAuth();

      expect(useAuthStore.getState().token).toBe("stored-token");
      expect(useAuthStore.getState().user).toEqual(TEST_USER);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should set loading false if no token", async () => {
      (getToken as any).mockResolvedValue(null);
      (getUser as any).mockResolvedValue(null);

      await useAuthStore.getState().loadAuth();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      (getToken as any).mockRejectedValue(new Error("storage error"));

      await useAuthStore.getState().loadAuth();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear auth and reset state", async () => {
      useAuthStore.setState({
        token: "test-token",
        user: TEST_USER,
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(clearAuth).toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("should merge updates into existing user", () => {
      useAuthStore.setState({
        user: TEST_USER,
        isAuthenticated: true,
      });

      useAuthStore.getState().updateUser({ name: "Updated Name", goal: "MUSCLE_GAIN" });

      expect(useAuthStore.getState().user?.name).toBe("Updated Name");
      expect(useAuthStore.getState().user?.goal).toBe("MUSCLE_GAIN");
      expect(useAuthStore.getState().user?.email).toBe("test@example.com");
    });

    it("should handle null user gracefully", () => {
      useAuthStore.setState({ user: null });

      useAuthStore.getState().updateUser({ name: "Updated" });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
