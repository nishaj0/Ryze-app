import client from "./client";
import { BodyMetric } from "../types";

export const logBodyMetric = async (weightKg: number, date?: string, notes?: string) => {
  const { data } = await client.post("/metrics/body", { weightKg, date, notes });
  return data as { metric: BodyMetric };
};

export const getBodyMetrics = async (from?: string, to?: string) => {
  const { data } = await client.get("/metrics/body", { params: { from, to } });
  return data as { metrics: BodyMetric[] };
};

export const deleteBodyMetric = async (id: string) => {
  await client.delete(`/metrics/body/${id}`);
};
