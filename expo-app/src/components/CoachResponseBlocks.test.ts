import { describe, it, expect } from "vitest";
import { ChatAction, ChatMessage, ChatResponseBlock } from "../api/chat";

describe("Coach Response Blocks & Safe Action Protocol", () => {
  it("should extract swap exercise payload attributes accurately", () => {
    const action: ChatAction = {
      type: "SWAP_EXERCISE",
      summary: "Swap Barbell Bench Press for Incline Dumbbell Press in Push Day A?",
      payload: {
        splitDayExerciseId: "sde-123",
        alternativeId: "alt-456",
        currentExerciseName: "Barbell Bench Press",
        proposedExerciseName: "Incline Dumbbell Press",
        splitDayName: "Push Day A",
        reason: "Reduces anterior shoulder impingement",
      },
    };

    expect(action.type).toBe("SWAP_EXERCISE");
    const payload = action.payload as any;
    expect(payload.currentExerciseName).toBe("Barbell Bench Press");
    expect(payload.proposedExerciseName).toBe("Incline Dumbbell Press");
    expect(payload.reason).toBe("Reduces anterior shoulder impingement");
  });

  it("should distinguish between confirmed, declined, and pending outcome states", () => {
    const pendingMsg: ChatMessage = {
      id: "msg-1",
      role: "ASSISTANT",
      content: "I recommend swapping this exercise.",
      outcome: null,
      createdAt: new Date().toISOString(),
    };

    const confirmedMsg: ChatMessage = {
      ...pendingMsg,
      id: "msg-2",
      outcome: "CONFIRMED",
    };

    const declinedMsg: ChatMessage = {
      ...pendingMsg,
      id: "msg-3",
      outcome: "CANCELLED",
    };

    expect(pendingMsg.outcome).toBeNull();
    expect(confirmedMsg.outcome).toBe("CONFIRMED");
    expect(declinedMsg.outcome).toBe("CANCELLED");
  });

  it("should format proposal resolution request payload correctly", () => {
    const formatPayload = (confirm: boolean | { action: "confirm" | "decline" }) => {
      return typeof confirm === "boolean"
        ? { confirm, action: confirm ? "confirm" : "decline" }
        : { confirm: confirm.action === "confirm", action: confirm.action };
    };

    expect(formatPayload(true)).toEqual({ confirm: true, action: "confirm" });
    expect(formatPayload(false)).toEqual({ confirm: false, action: "decline" });
    expect(formatPayload({ action: "confirm" })).toEqual({ confirm: true, action: "confirm" });
    expect(formatPayload({ action: "decline" })).toEqual({ confirm: false, action: "decline" });
  });
});
