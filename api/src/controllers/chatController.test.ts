import { beforeEach, describe, expect, it, vi } from "vitest";
import { Response } from "express";
import * as chat from "./chatController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { resetAllMocks, TEST_USER } from "../__tests__/helpers";
import { callGemini } from "../utils/gemini";

vi.mock("../utils/gemini", () => ({ callGemini: vi.fn() }));

describe("chatController", () => {
  const res = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response);
  const req = (body: Record<string, unknown> = {}) => ({ userId: TEST_USER.id, body, params: {} } as AuthRequest);
  beforeEach(() => resetAllMocks());

  it("executes read tools immediately and persists the reply", async () => {
    vi.mocked(callGemini).mockResolvedValue({ reply: "You trained twice.", tool: "getRecentSessions", arguments: {} });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "chat-1" });
    mockPrismaClient.workoutSession.findMany.mockResolvedValue([]);
    const response = res(); await chat.sendMessage(req({ content: "What did I train?" }), response);
    expect(mockPrismaClient.workoutSession.findMany).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
    expect(mockPrismaClient.chatMessage.create).toHaveBeenCalledTimes(2);
  });

  it("creates a rest-day proposal without performing a write", async () => {
    vi.mocked(callGemini).mockResolvedValue({ reply: "I can mark that as rest.", tool: "proposeMarkRestDay", arguments: { date: new Date().toISOString() } });
    mockPrismaClient.chatMessage.findMany.mockResolvedValue([]);
    mockPrismaClient.chatMessage.create.mockResolvedValue({ id: "proposal-1" });
    const response = res(); await chat.sendMessage(req({ content: "Mark today as rest" }), response);
    expect(mockPrismaClient.workoutSession.create).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ proposal: expect.objectContaining({ type: "REST_DAY" }) }));
  });

  it("does not execute a cancelled proposal", async () => {
    mockPrismaClient.chatMessage.findFirst.mockResolvedValue({ id: "proposal-1", action: { type: "REST_DAY", payload: {} }, outcome: null });
    mockPrismaClient.chatMessage.update.mockResolvedValue({ id: "proposal-1", outcome: "CANCELLED" });
    const response = res(); await chat.resolveProposal({ ...req({ confirm: false }), params: { id: "proposal-1" } } as AuthRequest, response);
    expect(mockPrismaClient.workoutSession.create).not.toHaveBeenCalled();
    expect(mockPrismaClient.chatMessage.update).toHaveBeenCalledWith(expect.objectContaining({ data: { outcome: "CANCELLED" } }));
  });
});
