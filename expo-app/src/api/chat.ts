import client from "./client";
export type ChatAction = { type: "SWAP_EXERCISE" | "REST_DAY" | "SPLIT_REGENERATION"; summary: string; payload: Record<string, unknown> };
export type DeepLink = { screen: string; params: Record<string, unknown> };
export type ChatResponseBlock =
  | { type: "text"; content: string }
  | { type: "data_card"; cardType: "split" | "session" | "exercise" | "progress"; data: Record<string, unknown>; deepLink?: DeepLink }
  | { type: "confirmation_card"; action: "swap_exercise" | "mark_rest_day" | "regenerate_split"; data: Record<string, unknown> }
  | { type: "navigation_action"; label: string; screen: string; params: Record<string, unknown> };
export type ChatResponse = { blocks: ChatResponseBlock[] };
export type ChatMessage = { id: string; role: "USER" | "ASSISTANT"; content: string; toolCalls?: { response?: ChatResponse }; action?: ChatAction; outcome?: string | null; createdAt: string };
export const getChatMessages = async () => (await client.get("/chat/messages")).data as { messages: ChatMessage[] };
export const sendChatMessage = async (content: string) => (await client.post("/chat/messages", { content })).data as { message: ChatMessage; proposal?: ChatAction };
export const resolveChatProposal = async (id: string, confirm: boolean) => (await client.post(`/chat/messages/${id}/resolve`, { confirm })).data;
