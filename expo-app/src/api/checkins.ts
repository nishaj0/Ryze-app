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

export const updateCheckIn = async (sessionId: string, rawText: string) => {
  const { data } = await client.put(`/checkins/${sessionId}`, {
    sessionId,
    rawText,
  });
  return data as { checkIn: CheckIn };
};
