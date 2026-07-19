import client from "./client";

export interface CheckIn {
  id: string;
  sessionId: string;
  userId: string;
  rawText: string;
  extractedIssues: string[];
  affectedExerciseId: string | null;
  sentiment: "GOOD" | "NEUTRAL" | "STRUGGLED";
  aiProcessed: boolean;
  createdAt: string;
}

export const createCheckIn = async (sessionId: string, rawText: string) => {
  const { data } = await client.post("/checkins", { sessionId, rawText });
  return data as { checkIn: CheckIn };
};

export const getCheckIn = async (sessionId: string) => {
  const { data } = await client.get(`/checkins/${sessionId}`);
  return data as { checkIn: CheckIn };
};

export const getCheckInHistory = async (days = 30) => {
  const { data } = await client.get("/checkins/history", { params: { days } });
  return data as { checkIns: Array<{ id: string; sessionId: string; rawText: string; extractedIssues: string[]; sentiment: "GOOD" | "NEUTRAL" | "STRUGGLED"; aiProcessed: boolean; createdAt: string }>; summary: Record<"GOOD" | "NEUTRAL" | "STRUGGLED", number>; days: number };
};

export const updateCheckIn = async (sessionId: string, rawText: string) => {
  const { data } = await client.put(`/checkins/${sessionId}`, {
    sessionId,
    rawText,
  });
  return data as { checkIn: CheckIn };
};
