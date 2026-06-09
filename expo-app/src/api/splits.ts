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

export const setActiveSplit = async (splitId: string) => {
  const { data } = await client.put("/splits/user/active", { splitId });
  return data as { userSplit: UserSplit };
};
