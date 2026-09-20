import client from "./client";
import { API_TIMEOUTS } from "../constants";

export interface SwapExercisePayload {
  splitDayExerciseId?: string;
  alternativeId?: string;
  currentExerciseName?: string;
  proposedExerciseName?: string;
  splitDayName?: string;
  reason?: string;
}

export interface RestDayPayload {
  date?: string;
  reason?: string | null;
}

export interface SplitRegenerationPayload {
  description?: string;
}

export type ChatAction = {
  type: "SWAP_EXERCISE" | "REST_DAY" | "SPLIT_REGENERATION";
  summary: string;
  payload: SwapExercisePayload | RestDayPayload | SplitRegenerationPayload | Record<string, unknown>;
};

export type DeepLink = {
  screen: string;
  params: Record<string, unknown>;
};

export type ChatResponseBlock =
  | { type: "text"; content: string }
  | {
      type: "data_card";
      cardType: "split" | "session" | "exercise" | "exercise_detail" | "progress";
      data: Record<string, unknown>;
      deepLink?: DeepLink;
    }
  | {
      type: "confirmation_card";
      action: "swap_exercise" | "mark_rest_day" | "regenerate_split";
      data: Record<string, unknown>;
    }
  | {
      type: "navigation_action";
      label: string;
      screen: string;
      params: Record<string, unknown>;
    };

export type ChatResponse = {
  blocks: ChatResponseBlock[];
};

export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  toolCalls?: { response?: ChatResponse; calls?: any[] };
  action?: ChatAction;
  outcome?: "CONFIRMED" | "CANCELLED" | string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  lastActiveAt: string;
};

export const getConversations = async () =>
  (await client.get("/chat/conversations")).data as { conversations: Conversation[] };

export const createConversation = async (title?: string) =>
  (await client.post("/chat/conversations", { title })).data as { conversation: Conversation };

export const getChatMessages = async (conversationId?: string) =>
  (await client.get("/chat/messages", { params: conversationId ? { conversationId } : {} })).data as {
    messages: ChatMessage[];
    conversationId: string | null;
  };

export const sendChatMessage = async (content: string, conversationId?: string) =>
  (
    await client.post(
      "/chat/messages",
      { content, conversationId },
      { timeout: API_TIMEOUTS.AI }
    )
  ).data as {
    message: ChatMessage;
    proposal?: ChatAction;
    conversationId: string;
  };

export const resolveChatProposal = async (
  id: string,
  confirmOrPayload: boolean | { action: "confirm" | "decline" }
) => {
  const body =
    typeof confirmOrPayload === "boolean"
      ? { confirm: confirmOrPayload, action: confirmOrPayload ? "confirm" : "decline" }
      : { confirm: confirmOrPayload.action === "confirm", action: confirmOrPayload.action };
  return (await client.post(`/chat/messages/${id}/resolve`, body)).data;
};
