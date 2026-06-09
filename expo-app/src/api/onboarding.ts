import client from "./client";
import { OnboardingData, Split } from "../types";

export const completeOnboarding = async (data: OnboardingData) => {
  const res = await client.post("/onboarding/complete", data);
  return res.data;
};

export const getRecommendedSplits = async (experienceLevel: string, daysAvailable: number) => {
  const { data } = await client.get("/onboarding/recommended-splits", {
    params: { experienceLevel, daysAvailable },
  });
  return data as { splits: Split[]; recommendedType: string | null };
};
