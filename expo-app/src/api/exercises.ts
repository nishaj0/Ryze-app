import client from "./client";
import { Exercise } from "../types";

export const listExercises = async (params?: { muscleGroup?: string; search?: string }) => {
  const { data } = await client.get("/exercises", { params });
  return data as { exercises: Exercise[] };
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
