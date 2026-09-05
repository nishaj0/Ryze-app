import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import bcrypt from "bcryptjs";
import * as authController from "../controllers/authController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe("authController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("register", () => {
    it("should return 400 if email already registered", async () => {
      req.body = { email: "test@example.com", password: "password123", name: "Test" };
      mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

      await expect(authController.register(req as AuthRequest, res as Response))
        .rejects.toThrow("Email already registered");
    });

    it("should create user and return token on success", async () => {
      req.body = { email: "new@example.com", password: "password123", name: "New User" };
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password");
      
      const newUser = { ...TEST_USER, id: "user-new", email: "new@example.com", name: "New User" };
      mockPrismaClient.user.create.mockResolvedValue(newUser);

      await authController.register(req as AuthRequest, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: { email: "new@example.com", passwordHash: "hashed-password", name: "New User" },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          }),
        })
      );
    });
  });

  describe("login", () => {
    it("should return 401 if user not found", async () => {
      req.body = { email: "nonexistent@example.com", password: "password123" };
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(authController.login(req as AuthRequest, res as Response))
        .rejects.toThrow("Invalid email or password");
    });

    it("should return 401 if password is invalid", async () => {
      req.body = { email: "test@example.com", password: "wrongpassword" };
      mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authController.login(req as AuthRequest, res as Response))
        .rejects.toThrow("Invalid email or password");
    });

    it("should return token on successful login", async () => {
      req.body = { email: "test@example.com", password: "password123" };
      mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);
      (bcrypt.compare as any).mockResolvedValue(true);

      await authController.login(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            id: TEST_USER.id,
            email: TEST_USER.email,
            name: TEST_USER.name,
          }),
        })
      );
    });
  });

  describe("me", () => {
    it("should return 404 if user not found", async () => {
      req.userId = "nonexistent-user";
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(authController.me(req as AuthRequest, res as Response))
        .rejects.toThrow("User not found");
    });

    it("should return user data on success", async () => {
      req.userId = TEST_USER.id;
      mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

      await authController.me(req as AuthRequest, res as Response);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
        }),
      });
      expect(res.json).toHaveBeenCalledWith({ user: TEST_USER });
    });
  });

  describe("updateProfile", () => {
    it("should update user profile with provided fields", async () => {
      req.userId = TEST_USER.id;
      req.body = { name: "Updated Name", goal: "WEIGHT_LOSS" };
      const updatedUser = { ...TEST_USER, name: "Updated Name", goal: "WEIGHT_LOSS" };
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      await authController.updateProfile(req as AuthRequest, res as Response);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { name: "Updated Name", goal: "WEIGHT_LOSS" },
      });
      expect(res.json).toHaveBeenCalledWith({ user: updatedUser });
    });

    it("should only update provided fields", async () => {
      req.userId = TEST_USER.id;
      req.body = { currentWeight: 75 };
      mockPrismaClient.user.update.mockResolvedValue({ ...TEST_USER, currentWeight: 75 });

      await authController.updateProfile(req as AuthRequest, res as Response);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { currentWeight: 75 },
      });
    });
  });

  describe("deleteAccount", () => {
    it("should delete private user-created splits and preserve community originals", async () => {
      req.userId = TEST_USER.id;
      mockPrismaClient.split.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaClient.user.delete.mockResolvedValue(TEST_USER);

      await authController.deleteAccount(req as AuthRequest, res as Response);

      expect(mockPrismaClient.split.deleteMany).toHaveBeenCalledWith({
        where: { createdById: TEST_USER.id, visibility: "PRIVATE" },
      });
      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Account deleted" });
    });
  });
});
