import { vi } from "vitest";

const mockMmkv = {
  set: vi.fn(),
  getString: vi.fn(),
  delete: vi.fn(),
  getAllKeys: vi.fn(() => []),
};

vi.mock("../utils/mmkv", () => ({
  mmkv: mockMmkv,
}));

vi.mock("expo-secure-store", () => ({
  default: {
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
  },
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

export { mockMmkv };
