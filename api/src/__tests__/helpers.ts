import jwt from "jsonwebtoken";
import { mockPrismaClient } from "./prisma-mock";
import { vi } from "vitest";

export const TEST_USER = {
  id: "user-1",
  email: "test@example.com",
  passwordHash: "$2a$12$hashedpassword",
  name: "Test User",
  onboardingDone: true,
  gender: "male",
  goal: "MUSCLE_GAIN",
  experienceLevel: "INTERMEDIATE",
  daysAvailable: 4,
  equipmentAccess: "full_gym",
  currentWeight: 80,
  height: 180,
  units: "kg",
  sleepHours: 8,
  reminderTime: "08:00",
  weeklyCheckin: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const TEST_TOKEN = jwt.sign(
  { userId: TEST_USER.id },
  process.env.JWT_SECRET || "test-secret",
  { expiresIn: "7d" }
);

export function resetAllMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as any).mockReset();
        }
      });
    }
  });
}

export function mockAuthMiddleware() {
  mockPrismaClient.user.findUnique.mockResolvedValue({ id: TEST_USER.id });
}
