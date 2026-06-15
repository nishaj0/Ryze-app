import client from "./client";
import { WorkoutSession, WorkoutSummary, CalendarSession } from "../types";

export const createSession = async (splitDayId: string, date?: string) => {
  const { data } = await client.post("/sessions", { splitDayId, date });
  return data as { session: WorkoutSession; lastSessionLogs: Record<string, any> };
};

export const listSessions = async (page = 1, limit = 20) => {
  const { data } = await client.get("/sessions", { params: { page, limit } });
  return data;
};

export const getSession = async (id: string) => {
  const { data } = await client.get(`/sessions/${id}`);
  return data as { session: WorkoutSession };
};

export const completeSession = async (id: string, notes?: string, durationMinutes?: number) => {
  const { data } = await client.patch(`/sessions/${id}/complete`, { notes, durationMinutes });
  return data as { session: WorkoutSession; summary: WorkoutSummary };
};

export const markRestDay = async (splitDayId: string, date?: string, reason?: string) => {
  const { data } = await client.post("/sessions/rest", { splitDayId, date, reason });
  return data as { session: WorkoutSession };
};

export const addExercise = async (sessionId: string, exerciseId: string) => {
  const { data } = await client.post(`/sessions/${sessionId}/exercises`, { exerciseId });
  return data;
};

export const swapExercise = async (sessionId: string, exerciseLogId: string, newExerciseId: string) => {
  const { data } = await client.patch(`/sessions/${sessionId}/exercises/${exerciseLogId}/swap`, {
    newExerciseId,
  });
  return data;
};

export const logSet = async (exerciseLogId: string, weightKg: number, reps: number) => {
  const { data } = await client.post(`/sessions/exercises/${exerciseLogId}/sets`, {
    weightKg,
    reps,
  });
  return data;
};

export const deleteSet = async (exerciseLogId: string, setId: string) => {
  await client.delete(`/sessions/exercises/${exerciseLogId}/sets/${setId}`);
};

export const syncSession = async (sessionData: any) => {
  const { data } = await client.post("/sessions/sync", sessionData);
  return data as { session: WorkoutSession; summary: WorkoutSummary };
};

export const updateExerciseNotes = async (exerciseLogId: string, notes: string) => {
  const { data } = await client.patch(`/sessions/exercise-logs/${exerciseLogId}/notes`, { notes });
  return data;
};

export const getCalendarSessions = async (start: string, end: string) => {
  const { data } = await client.get("/sessions/calendar", { params: { start, end } });
  return data as { sessions: CalendarSession[] };
};

export const updateSession = async (id: string, updates: { restReason?: string; notes?: string }) => {
  const { data } = await client.patch(`/sessions/${id}`, updates);
  return data as { session: WorkoutSession };
};
