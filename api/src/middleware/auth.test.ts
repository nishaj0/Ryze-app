import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, TEST_TOKEN, resetAllMocks } from "../__tests__/helpers";

describe("authMiddleware", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    resetAllMocks();
    req = { headers: {} as any };
    res = {};
    next = vi.fn();
  });

  it("should return 401 if no authorization header", async () => {
    await authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "No token provided" }));
  });

  it("should return 401 if authorization header doesn't start with Bearer", async () => {
    req.headers = { authorization: "Basic some-token" } as any;
    await authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "No token provided" }));
  });

  it("should return 401 for invalid token", async () => {
    req.headers = { authorization: "Bearer invalid-token" } as any;
    await authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "Invalid or expired token" }));
  });

  it("should return 401 if user no longer exists", async () => {
    req.headers = { authorization: `Bearer ${TEST_TOKEN}` } as any;
    mockPrismaClient.user.findUnique.mockResolvedValue(null);

    await authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "User no longer exists" }));
  });

  it("should set userId and call next for valid token", async () => {
    req.headers = { authorization: `Bearer ${TEST_TOKEN}` } as any;
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: TEST_USER.id });

    await authMiddleware(req as AuthRequest, res as Response, next);
    expect(req.userId).toBe(TEST_USER.id);
    expect(next).toHaveBeenCalled();
  });
});
