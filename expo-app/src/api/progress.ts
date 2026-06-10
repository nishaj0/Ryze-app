import client from "./client";
import { ProgressOverview, ExerciseProgress, MuscleVolume, HeatmapEntry } from "../types";

export const getOverview = async () => {
  const { data } = await client.get("/progress/overview");
  return data as { overview: ProgressOverview };
};

export const getExerciseProgress = async (exerciseId: string) => {
  const { data } = await client.get(`/progress/exercise/${exerciseId}`);
  return data as { progression: ExerciseProgress[] };
};

export const getMuscleVolume = async () => {
  const { data } = await client.get("/progress/muscle-volume");
  return data as { muscleVolumes: MuscleVolume[] };
};

export const getHeatmap = async () => {
  const { data } = await client.get("/progress/heatmap");
  return data as { heatmap: HeatmapEntry[] };
};

export const getVolumeHistory = async (weeks: number = 8) => {
  const { data } = await client.get(`/progress/volume-history?weeks=${weeks}`);
  return data as {
    weekly: { week: string; volume: number; workouts: number }[];
    daily: { day: string; count: number }[];
  };
};
