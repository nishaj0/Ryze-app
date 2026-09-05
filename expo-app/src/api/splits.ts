import client from "./client";
import { Split, UserSplit } from "../types";

export const listSplits = async () => {
  const { data } = await client.get("/splits");
  return data as { userSplits: UserSplit[] };
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

export const removeFromLibrary = async (splitId: string) => {
  await client.delete(`/splits/${splitId}/library`);
};

export const publishSplit = async (splitId: string) => {
  const { data } = await client.post(`/splits/${splitId}/publish`);
  return data as { split: Split };
};

export const unpublishSplit = async (splitId: string) => {
  await client.post(`/splits/${splitId}/unpublish`);
};

export type CommunitySplitSort = "recent" | "liked" | "saved";

export const listCommunitySplits = async (params: {
  page?: number;
  limit?: number;
  daysPerWeek?: number;
  splitTypeTag?: string;
  sort?: CommunitySplitSort;
} = {}) => {
  const { data } = await client.get("/splits/community", { params });
  return data as { splits: Split[]; page: number; limit: number; total: number; hasMore: boolean };
};

export const getCommunitySplit = async (splitId: string) => {
  const { data } = await client.get(`/splits/community/${splitId}`);
  return data as { split: Split };
};

export const toggleSplitLike = async (splitId: string) => {
  const { data } = await client.post(`/splits/community/${splitId}/like`);
  return data as { liked: boolean; likeCount: number };
};

export const forkCommunitySplit = async (splitId: string, activateForOnboarding = false) => {
  const { data } = await client.post(`/splits/community/${splitId}/fork`, { activateForOnboarding });
  return data as { split: Split };
};

export const generateAISplit = async (
  description: string,
  onboardingContext: {
    goal: string;
    experienceLevel: string;
    daysAvailable: number;
    equipmentAccess: string;
    gender: string;
  }
) => {
  const { data } = await client.post(
    "/splits/ai-generate",
    { description, onboardingContext },
    { timeout: 60_000 }
  );
  return data as {
    split: {
      name: string;
      description: string;
      type: string;
      daysPerWeek: number;
      days: Array<{
        dayNumber: number;
        name: string;
        muscleGroups: string[];
        isRest: boolean;
        exercises: Array<{
          exerciseId: string;
          exerciseName: string;
          targetSets: number;
          targetRepsMin: number;
          targetRepsMax: number;
        }>;
      }>;
    };
    warnings: string[];
  };
};
