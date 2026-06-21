import client from "./client";
import { Exercise } from "../types";

export const listExercises = async (params?: { muscle?: string; search?: string; page?: number; limit?: number }) => {
  const { data } = await client.get("/exercises", { params });
  return data as { exercises: Exercise[]; total: number; page: number; totalPages: number };
};

export const getExercise = async (id: string) => {
  const { data } = await client.get(`/exercises/${id}`);
  return data as { exercise: Exercise };
};

export const getAlternatives = async (id: string) => {
  const { data } = await client.get(`/exercises/${id}/alternatives`);
  return data;
};

export const getExerciseHistory = async (id: string) => {
  const { data } = await client.get(`/exercises/${id}/history`);
  return data;
};

export const requestExercise = async (payload: {
  name: string;
  description?: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  category?: string;
  instructions?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}) => {
  const { data } = await client.post("/exercises/request", payload);
  return data;
};
