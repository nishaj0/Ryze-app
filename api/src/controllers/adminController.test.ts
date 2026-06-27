import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import * as adminController from "../controllers/adminController";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { resetAllMocks } from "../__tests__/helpers";

describe("adminController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    resetAllMocks();
    req = { query: {}, params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    next = vi.fn();
  });

  describe("getDashboardStats", () => {
    it("should return dashboard statistics", async () => {
      mockPrismaClient.user.count.mockResolvedValueOnce(100); // totalUsers
      mockPrismaClient.user.count.mockResolvedValueOnce(80); // onboardedUsers
      mockPrismaClient.workoutSession.count.mockResolvedValue(500); // totalSessions
      mockPrismaClient.split.count.mockResolvedValue(20); // totalSplits
      mockPrismaClient.exercise.count.mockResolvedValue(200); // totalExercises
      mockPrismaClient.user.findMany.mockResolvedValue([
        { id: "user-1", name: "User 1", email: "user1@example.com", createdAt: new Date(), onboardingDone: true },
      ]);
      mockPrismaClient.userSplit.count.mockResolvedValue(50); // activeSplitCount
      mockPrismaClient.workoutSession.groupBy.mockResolvedValue([]);

      await adminController.getDashboardStats(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        stats: expect.objectContaining({
          totalUsers: 100,
          onboardedUsers: 80,
          totalSessions: 500,
          totalSplits: 20,
          totalExercises: 200,
          activeSplitCount: 50,
        }),
        recentUsers: expect.any(Array),
        dailySessions: expect.any(Array),
      });
    });
  });

  describe("listUsers", () => {
    it("should return paginated users", async () => {
      req.query = { page: "1", limit: "20" };
      const users = [{ id: "user-1", name: "User 1" }];
      mockPrismaClient.user.findMany.mockResolvedValue(users);
      mockPrismaClient.user.count.mockResolvedValue(1);

      await adminController.listUsers(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        users,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it("should search users by email or name", async () => {
      req.query = { search: "test" };
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      await adminController.listUsers(req as Request, res as Response, next);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: "test", mode: "insensitive" } },
              { name: { contains: "test", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });

  describe("getUser", () => {
    it("should return 404 if user not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await adminController.getUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return user without passwordHash", async () => {
      req.params = { id: "user-1" };
      const user = {
        id: "user-1",
        name: "User 1",
        email: "user1@example.com",
        passwordHash: "secret-hash",
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(user);

      await adminController.getUser(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        user: expect.not.objectContaining({ passwordHash: expect.anything() }),
      });
    });
  });

  describe("updateUser", () => {
    it("should update user fields", async () => {
      req.params = { id: "user-1" };
      req.body = { name: "Updated Name", goal: "WEIGHT_LOSS" };
      const updatedUser = { id: "user-1", name: "Updated Name", goal: "WEIGHT_LOSS" };
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      await adminController.updateUser(req as Request, res as Response, next);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({ name: "Updated Name", goal: "WEIGHT_LOSS" }),
        })
      );
      expect(res.json).toHaveBeenCalledWith({ user: updatedUser });
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      req.params = { id: "user-1" };
      mockPrismaClient.user.delete.mockResolvedValue({});

      await adminController.deleteUser(req as Request, res as Response, next);

      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(res.json).toHaveBeenCalledWith({ message: "User deleted" });
    });
  });

  describe("resetOnboarding", () => {
    it("should reset user onboarding", async () => {
      req.params = { id: "user-1" };
      mockPrismaClient.user.update.mockResolvedValue({});

      await adminController.resetOnboarding(req as Request, res as Response, next);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: expect.objectContaining({
          onboardingDone: false,
          gender: null,
          goal: null,
        }),
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Onboarding reset" });
    });
  });

  describe("sendBroadcast", () => {
    it("should send broadcast to all users", async () => {
      req.body = { title: "Test Broadcast", body: "Test message" };
      const users = [{ id: "user-1" }, { id: "user-2" }];
      mockPrismaClient.user.findMany.mockResolvedValue(users);
      mockPrismaClient.notification.createMany.mockResolvedValue({ count: 2 });

      await adminController.sendBroadcast(req as Request, res as Response, next);

      expect(mockPrismaClient.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "user-1", title: "Test Broadcast" }),
          expect.objectContaining({ userId: "user-2", title: "Test Broadcast" }),
        ]),
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Broadcast sent to 2 users" });
    });
  });

  describe("createExercise", () => {
    it("should return 400 if name is missing", async () => {
      req.body = {};

      await adminController.createExercise(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Exercise name is required" });
    });

    it("should return 409 if exercise already exists", async () => {
      req.body = { name: "Bench Press" };
      mockPrismaClient.exercise.findUnique.mockResolvedValue({ id: "existing" });

      await adminController.createExercise(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Exercise with this name already exists" });
    });

    it("should create exercise with muscles and images", async () => {
      req.body = {
        name: "New Exercise",
        primaryMuscles: ["chest"],
        secondaryMuscles: ["triceps"],
        images: [{ url: "http://example.com/img.jpg", publicId: "img-1" }],
      };
      mockPrismaClient.exercise.findUnique.mockResolvedValue(null);
      mockPrismaClient.exercise.create.mockResolvedValue({ id: "ex-new", name: "New Exercise" });
      mockPrismaClient.muscle.findUnique.mockResolvedValue({ id: "muscle-1", name: "chest" });
      mockPrismaClient.exerciseMuscle.create.mockResolvedValue({});
      mockPrismaClient.exerciseImage.create.mockResolvedValue({});
      mockPrismaClient.exercise.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: "ex-new",
        name: "New Exercise",
        muscles: [],
        images: [],
      });

      await adminController.createExercise(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ exercise: expect.any(Object) });
    });
  });
});
