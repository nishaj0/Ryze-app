import client from "./client";
import { Split, UserSplit } from "../types";

export const listSplits = async () => {
  const { data } = await client.get("/splits");
  return data as { splits: Split[] };
};

export const getSplit = async (id: string) => {
  const { data } = await client.get(`/splits/${id}`);
  return data as { split: Split };
};

export const getActiveSplit = async () => {
  const { data } = await client.get("/splits/user/active");
  return data as { userSplit: UserSplit | null };
};

export const setActiveSplit = async (splitId: string, phase?: string) => {
  const { data } = await client.put("/splits/user/active", { splitId, phase });
  return data as { userSplit: UserSplit };
};

export const createSplit = async (splitData: any) => {
  const { data } = await client.post("/splits", splitData);
  return data as { split: Split };
};

export const updateSplit = async (id: string, splitData: any) => {
  const { data } = await client.put(`/splits/${id}`, splitData);
  return data as { split: Split };
};

export const updateSplitExercise = async (id: string, exerciseId: string) => {
  const { data } = await client.patch(`/splits/exercises/${id}`, { exerciseId });
  return data;
};
