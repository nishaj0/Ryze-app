import { beforeEach, describe, expect, it, vi } from "vitest";
import { Response } from "express";
import * as chat from "./chatController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { resetAllMocks, TEST_USER } from "../__tests__/helpers";
import { callGeminiWithTools } from "../utils/gemini";

vi.mock("../utils/gemini", () => ({ callGeminiWithTools: vi.fn() }));

describe("chatController", () => {
  const res = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response);
  const req = (body: Record<string, unknown> = {}) => ({ userId: TEST_USER.id, body, params: {} } as AuthRequest);
  beforeEach(() => resetAllMocks());

  it("executes read tools immediately and persists the reply", async () => {
    vi.mocked(callGeminiWithTools).mockImplementation(async (options) => {
      await options.execute("getRecentSessions", {});
      return { reply: "You trained twice.", calls: [] };
    });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    mockPrismaClient.workoutSession.findMany.mockResolvedValue([]);
    const response = res(); await chat.sendMessage(req({ content: "What did I train?" }), response);
    expect(mockPrismaClient.workoutSession.findMany).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
    expect(mockPrismaClient.chatMessage.create).toHaveBeenCalledTimes(2);
  });

  it("creates a rest-day proposal without performing a write", async () => {
    vi.mocked(callGeminiWithTools).mockImplementation(async (options) => {
      await options.execute("proposeMarkRestDay", { date: new Date().toISOString() });
      return { reply: "I can mark that as rest.", calls: [] };
    });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "proposal-1" });
    const response = res(); await chat.sendMessage(req({ content: "Mark today as rest" }), response);
    expect(mockPrismaClient.workoutSession.create).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ proposal: expect.objectContaining({ type: "REST_DAY" }) }));
  });

  it("retrieves the active split when the user asks whether Coach can read it", async () => {
    vi.mocked(callGeminiWithTools).mockResolvedValue({ reply: "Here is your split.", calls: [] });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    mockPrismaClient.userSplit.findFirst.mockResolvedValue(null);
    const response = res(); await chat.sendMessage(req({ content: "Are you able to read my split?" }), response);
    expect(mockPrismaClient.userSplit.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: TEST_USER.id, isActive: true } }));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ response: { blocks: expect.arrayContaining([expect.objectContaining({ content: "You don't have an active split yet." })]) } }));
  });

  it("keeps multiple returned data cards in one assistant response", async () => {
    vi.mocked(callGeminiWithTools).mockImplementation(async (options) => {
      await options.execute("getCurrentSplit", {});
      await options.execute("getRecentSessions", {});
      return { reply: "Here is your plan and latest session.", calls: [] };
    });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    mockPrismaClient.userSplit.findFirst.mockResolvedValue({ splitId: "split-1", split: { id: "split-1", name: "PPL", days: [] } });
    mockPrismaClient.workoutSession.findMany.mockResolvedValue([{ id: "session-1", date: new Date(), splitDay: { name: "Push" }, exerciseLogs: [] }]);
    const response = res(); await chat.sendMessage(req({ content: "Show my split and last workout" }), response);
    const assistantCreate = vi.mocked(mockPrismaClient.chatMessage.create).mock.calls[1][0];
    expect(assistantCreate.data.toolCalls.response.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "data_card", cardType: "split" }),
      expect.objectContaining({ type: "data_card", cardType: "session" }),
    ]));
  });

  it("returns a clear text block for empty exercise history", async () => {
    vi.mocked(callGeminiWithTools).mockImplementation(async (options) => {
      await options.execute("getExerciseHistory", { exerciseName: "Bench Press" });
      return { reply: "I checked your log.", calls: [] };
    });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    mockPrismaClient.exercise.findUnique.mockResolvedValue({ id: "exercise-1", name: "Bench Press" });
    mockPrismaClient.exerciseLog.findMany.mockResolvedValue([]);
    const response = res(); await chat.sendMessage(req({ content: "Show my Bench Press history" }), response);
    const assistantCreate = vi.mocked(mockPrismaClient.chatMessage.create).mock.calls[1][0];
    expect(assistantCreate.data.toolCalls.response.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "text", content: "You haven't logged Bench Press yet." }),
    ]));
  });

  it("maps a navigation tool to a fixed app destination", async () => {
    vi.mocked(callGeminiWithTools).mockImplementation(async (options) => {
      await options.execute("openPhotosTab", {});
      return { reply: "", calls: [] };
    });
    mockPrismaClient.conversation.findFirst.mockResolvedValue({ id: "conv-1" });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    const response = res(); await chat.sendMessage(req({ content: "How do I take a progress photo?" }), response);
    const assistantCreate = vi.mocked(mockPrismaClient.chatMessage.create).mock.calls[1][0];
    expect(assistantCreate.data.toolCalls.response.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "navigation_action", screen: "Photos", params: { screen: "PhotosTimeline" } }),
    ]));
  });

  it("does not execute a cancelled proposal", async () => {
    mockPrismaClient.chatMessage.findFirst.mockResolvedValue({ id: "proposal-1", action: { type: "REST_DAY", payload: {} }, outcome: null });
    mockPrismaClient.chatMessage.update.mockResolvedValue({ id: "proposal-1", outcome: "CANCELLED" });
    const response = res(); await chat.resolveProposal({ ...req({ confirm: false }), params: { id: "proposal-1" } } as AuthRequest, response);
    expect(mockPrismaClient.workoutSession.create).not.toHaveBeenCalled();
    expect(mockPrismaClient.chatMessage.update).toHaveBeenCalledWith(expect.objectContaining({ data: { outcome: "CANCELLED" } }));
  });
});
