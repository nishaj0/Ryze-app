import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as checkinController from "../controllers/checkinController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

vi.mock("../utils/gemini", () => ({
  callGemini: vi.fn(),
}));

vi.mock("./splitSuggestionController", () => ({
  evaluateForUser: vi.fn(),
}));

describe("checkinController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { body: {}, params: {}, userId: TEST_USER.id, headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("createCheckIn", () => {
    it("should return 204 if rawText is empty", async () => {
      req.body = { sessionId: "session-1", rawText: "   " };

      await checkinController.createCheckIn(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it("should return 404 if session not found", async () => {
      req.body = { sessionId: "nonexistent", rawText: "Felt good" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(null);

      await expect(checkinController.createCheckIn(req as AuthRequest, res as Response))
        .rejects.toThrow("Session not found");
    });

    it("should return 403 if user doesn't own the session", async () => {
      req.body = { sessionId: "session-1", rawText: "Felt good" };
      const session = { id: "session-1", userId: "other-user" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);

      await expect(checkinController.createCheckIn(req as AuthRequest, res as Response))
        .rejects.toThrow("Unauthorized");
    });

    it("should create check-in and process in background", async () => {
      req.body = { sessionId: "session-1", rawText: "Felt good today" };
      const session = { id: "session-1", userId: TEST_USER.id };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);
      
      const checkIn = { id: "checkin-1", sessionId: "session-1", rawText: "Felt good today" };
      mockPrismaClient.checkIn.upsert.mockResolvedValue(checkIn);
      mockPrismaClient.exerciseLog.findMany.mockResolvedValue([]);

      await checkinController.createCheckIn(req as AuthRequest, res as Response);

      expect(mockPrismaClient.checkIn.upsert).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ checkIn });
    });
  });

  describe("getCheckIn", () => {
    it("should return 404 if session not found", async () => {
      req.params = { sessionId: "nonexistent" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(null);

      await expect(checkinController.getCheckIn(req as AuthRequest, res as Response))
        .rejects.toThrow("Session not found");
    });

    it("should return 403 if user doesn't own the session", async () => {
      req.params = { sessionId: "session-1" };
      const session = { id: "session-1", userId: "other-user" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);

      await expect(checkinController.getCheckIn(req as AuthRequest, res as Response))
        .rejects.toThrow("Unauthorized");
    });

    it("should return 204 if check-in not found", async () => {
      req.params = { sessionId: "session-1" };
      const session = { id: "session-1", userId: TEST_USER.id };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);
      mockPrismaClient.checkIn.findUnique.mockResolvedValue(null);

      await checkinController.getCheckIn(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it("should return check-in if found", async () => {
      req.params = { sessionId: "session-1" };
      const session = { id: "session-1", userId: TEST_USER.id };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);
      
      const checkIn = { id: "checkin-1", sessionId: "session-1", rawText: "Felt good" };
      mockPrismaClient.checkIn.findUnique.mockResolvedValue(checkIn);

      await checkinController.getCheckIn(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ checkIn });
    });
  });

  describe("retryUnprocessed", () => {
    it("should return 401 if admin key is invalid", async () => {
      req.headers = { "x-admin-key": "wrong-key" };

      await expect(checkinController.retryUnprocessed(req as AuthRequest, res as Response))
        .rejects.toThrow("Unauthorized");
    });

    it("should process unprocessed check-ins", async () => {
      req.headers = { "x-admin-key": "test-admin-key" };
      const unprocessed = [{ id: "checkin-1" }, { id: "checkin-2" }];
      mockPrismaClient.checkIn.findMany.mockResolvedValue(unprocessed);
      mockPrismaClient.checkIn.findUnique.mockResolvedValue(null);

      await checkinController.retryUnprocessed(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        processed: expect.any(Number),
        failed: expect.any(Number),
      });
    });
  });
});
