import client from "./client";
export type ChatAction = { type: "SWAP_EXERCISE" | "REST_DAY" | "SPLIT_REGENERATION"; summary: string; payload: Record<string, unknown> };
export type ChatMessage = { id: string; role: "USER" | "ASSISTANT"; content: string; action?: ChatAction; outcome?: string | null; createdAt: string };
export const getChatMessages = async () => (await client.get("/chat/messages")).data as { messages: ChatMessage[] };
export const sendChatMessage = async (content: string) => (await client.post("/chat/messages", { content })).data as { message: ChatMessage; proposal?: ChatAction };
export const resolveChatProposal = async (id: string, confirm: boolean) => (await client.post(`/chat/messages/${id}/resolve`, { confirm })).data;
