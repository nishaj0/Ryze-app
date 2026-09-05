import client from "./client";
import {
  ProgressOverview,
  ExerciseProgress,
  MuscleVolume,
  HeatmapEntry,
  OverloadFilterOption,
  OverloadHistoryPoint,
  OverloadPR,
  OverloadTopSet,
} from "../types";

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

export const getWeeklyMuscleVolume = async () => {
  const { data } = await client.get("/progress/weekly-muscle-volume");
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

export const getOverloadFilters = async () => {
  const { data } = await client.get("/progress/overload/filters");
  return data as {
    hasHistory: boolean;
    muscles: OverloadFilterOption[];
    splitDays: OverloadFilterOption[];
  };
};

export const getOverloadHistory = async (exerciseId: string, splitDay?: { id: string; name: string }) => {
  const { data } = await client.get(`/progress/overload/${exerciseId}`, {
    params: splitDay ? { splitDayId: splitDay.id, splitDayName: splitDay.name } : undefined,
  });
  return data as {
    latestTopSet: OverloadTopSet | null;
    history: OverloadHistoryPoint[];
    prs: OverloadPR[];
  };
};
