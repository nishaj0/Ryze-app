import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as sessionController from "../controllers/sessionController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

describe("sessionController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { body: {}, params: {}, query: {}, userId: TEST_USER.id };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("createSession", () => {
    it("should return 409 if session already exists for this day", async () => {
      req.body = { splitDayId: "day-1", date: "2024-01-15" };
      mockPrismaClient.workoutSession.findFirst.mockResolvedValue({ id: "existing-session" });

      await expect(sessionController.createSession(req as AuthRequest, res as Response))
        .rejects.toThrow("Session already exists for this day");
    });

    it("should return 404 if split day not found", async () => {
      req.body = { splitDayId: "nonexistent", date: "2024-01-15" };
      mockPrismaClient.workoutSession.findFirst.mockResolvedValue(null);
      mockPrismaClient.splitDay.findUnique.mockResolvedValue(null);

      await expect(sessionController.createSession(req as AuthRequest, res as Response))
        .rejects.toThrow("Split day not found");
    });

    it("should create session with exercise logs", async () => {
      req.body = { splitDayId: "day-1", date: "2024-01-15" };
      mockPrismaClient.workoutSession.findFirst.mockResolvedValue(null);
      
      const splitDay = {
        id: "day-1",
        name: "Push Day",
        exercises: [
          { id: "sde-1", exerciseId: "ex-1", order: 0, exercise: { name: "Bench Press" } },
        ],
      };
      mockPrismaClient.splitDay.findUnique.mockResolvedValue(splitDay);
      
      const session = { id: "session-1", userId: TEST_USER.id, splitDayId: "day-1" };
      mockPrismaClient.workoutSession.create.mockResolvedValue({
        ...session,
        exerciseLogs: [],
        splitDay,
      });
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue({ date: new Date() });
      mockPrismaClient.workoutSession.findFirst.mockResolvedValue(null);

      await sessionController.createSession(req as AuthRequest, res as Response);

      expect(mockPrismaClient.workoutSession.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("listSessions", () => {
    it("should return paginated sessions", async () => {
      req.query = { page: "1", limit: "20" };
      const sessions = [{ id: "session-1" }, { id: "session-2" }];
      mockPrismaClient.workoutSession.findMany.mockResolvedValue(sessions);
      mockPrismaClient.workoutSession.count.mockResolvedValue(2);

      await sessionController.listSessions(req as AuthRequest, res as Response);

      expect(mockPrismaClient.workoutSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USER.id },
          skip: 0,
          take: 20,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        sessions,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe("getSession", () => {
    it("should return 404 if session not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(null);

      await expect(sessionController.getSession(req as AuthRequest, res as Response))
        .rejects.toThrow("Session not found");
    });

    it("should return session with PRs", async () => {
      req.params = { id: "session-1" };
      const session = {
        id: "session-1",
        userId: TEST_USER.id,
        date: new Date("2024-01-15"),
      };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);
      mockPrismaClient.personalRecord.findMany.mockResolvedValue([]);

      await sessionController.getSession(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        session,
        prs: [],
      });
    });
  });

  describe("completeSession", () => {
    it("should return 404 if session not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(null);

      await expect(sessionController.completeSession(req as AuthRequest, res as Response))
        .rejects.toThrow("Session not found");
    });

    it("should complete session and detect PRs", async () => {
      req.params = { id: "session-1" };
      req.body = { notes: "Great workout", durationMinutes: 60 };
      
      const session = {
        id: "session-1",
        userId: TEST_USER.id,
        date: new Date(),
        exerciseLogs: [
          {
            exerciseId: "ex-1",
            setLogs: [{ weightKg: 100, reps: 8 }],
          },
        ],
      };
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue(session);
      mockPrismaClient.personalRecord.findFirst.mockResolvedValue(null);
      mockPrismaClient.personalRecord.create.mockResolvedValue({});
      mockPrismaClient.workoutSession.update.mockResolvedValue({
        ...session,
        status: "COMPLETED",
        exerciseLogs: session.exerciseLogs,
      });

      await sessionController.completeSession(req as AuthRequest, res as Response);

      expect(mockPrismaClient.workoutSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "COMPLETED" }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            totalVolume: expect.any(Number),
            totalSets: expect.any(Number),
            exercisesCompleted: expect.any(Number),
          }),
        })
      );
    });
  });

  describe("logSet", () => {
    it("should return 404 if exercise log not found", async () => {
      req.params = { exerciseLogId: "nonexistent" };
      mockPrismaClient.exerciseLog.findUnique.mockResolvedValue(null);

      await expect(sessionController.logSet(req as AuthRequest, res as Response))
        .rejects.toThrow("Exercise log not found");
    });

    it("should log set with auto-incrementing set number", async () => {
      req.params = { exerciseLogId: "log-1" };
      req.body = { weightKg: 100, reps: 8 };
      
      const exerciseLog = {
        id: "log-1",
        sessionId: "session-1",
        exerciseId: "ex-1",
        setLogs: [{ setNumber: 2 }],
      };
      mockPrismaClient.exerciseLog.findUnique.mockResolvedValue(exerciseLog);
      mockPrismaClient.setLog.create.mockResolvedValue({ id: "set-3", setNumber: 3 });
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue({ userId: TEST_USER.id, splitDayId: "day-1" });
      mockPrismaClient.workoutSession.findFirst.mockResolvedValue(null);

      await sessionController.logSet(req as AuthRequest, res as Response);

      expect(mockPrismaClient.setLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            setNumber: 3,
            weightKg: 100,
            reps: 8,
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("markRestDay", () => {
    it("should create a SKIPPED session", async () => {
      req.body = { splitDayId: "day-1", date: "2024-01-15", reason: "Needed rest" };
      const session = { id: "session-1", status: "SKIPPED" };
      mockPrismaClient.splitDay.findUnique.mockResolvedValue({ name: "Push Day" });
      mockPrismaClient.workoutSession.create.mockResolvedValue(session);

      await sessionController.markRestDay(req as AuthRequest, res as Response);

      expect(mockPrismaClient.workoutSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SKIPPED",
            splitDayName: "Push Day",
            restReason: "Needed rest",
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("syncSession", () => {
    it("should sync offline session data", async () => {
      req.body = {
        splitDayId: "day-1",
        date: "2024-01-15",
        durationMinutes: 60,
        exercises: [
          {
            exerciseId: "ex-1",
            setLogs: [{ weightKg: 100, reps: 8 }],
          },
        ],
      };

      mockPrismaClient.$transaction.mockImplementation(async (fn: any) => {
        const result = await fn(mockPrismaClient);
        return result;
      });

      const session = { id: "session-1", userId: TEST_USER.id };
      mockPrismaClient.splitDay.findUnique.mockResolvedValue({ name: "Push Day" });
      mockPrismaClient.workoutSession.create.mockResolvedValue(session);
      mockPrismaClient.exerciseLog.create.mockResolvedValue({ id: "log-1" });
      mockPrismaClient.setLog.create.mockResolvedValue({});
      mockPrismaClient.personalRecord.findFirst.mockResolvedValue(null);
      mockPrismaClient.personalRecord.create.mockResolvedValue({});
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue({
        ...session,
        exerciseLogs: [],
        splitDay: {},
      });

      await sessionController.syncSession(req as AuthRequest, res as Response);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getCalendarSessions", () => {
    it("should return 400 if start/end not provided", async () => {
      req.query = {};

      await expect(sessionController.getCalendarSessions(req as AuthRequest, res as Response))
        .rejects.toThrow("start and end query params are required");
    });

    it("should return sessions in date range", async () => {
      req.query = { start: "2024-01-01", end: "2024-01-31" };
      const sessions = [
        {
          id: "session-1",
          date: new Date("2024-01-15"),
          status: "COMPLETED",
          splitDay: { name: "Push", muscleGroups: "[]", isRest: false },
          exerciseLogs: [],
        },
      ];
      mockPrismaClient.workoutSession.findMany.mockResolvedValue(sessions);

      await sessionController.getCalendarSessions(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ sessions: expect.any(Array) });
    });
  });
});
