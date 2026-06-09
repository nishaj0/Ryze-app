import client from "./client";
import { PersonalRecord } from "../types";

export const getRecords = async () => {
  const { data } = await client.get("/records");
  return data as { records: PersonalRecord[] };
};

export const getExerciseRecords = async (exerciseId: string) => {
  const { data } = await client.get(`/records/exercise/${exerciseId}`);
  return data;
};
