import client from "./client";

export interface SplitSuggestion {
  id: string;
  userId: string;
  splitDayId: string;
  exerciseId: string | null;
  suggestionType: "SWAP_EXERCISE" | "REDUCE_VOLUME" | "ADD_DELOAD" | "ADJUST_REST";
  suggestedAlternativeExerciseId: string | null;
  reasoning: string;
  basedOnCheckInIds: string[];
  status: "PENDING" | "ACCEPTED" | "DISMISSED";
  createdAt: string;
  resolvedAt: string | null;
  exercise: { name: string } | null;
  suggestedAlternative: { name: string } | null;
  splitDay: { name: string };
}

export const getSuggestions = async () => {
  const { data } = await client.get("/suggestions");
  return data as { suggestions: SplitSuggestion[] };
};

export const acceptSuggestion = async (id: string) => {
  const { data } = await client.post(`/suggestions/${id}/accept`);
  return data;
};

export const dismissSuggestion = async (id: string) => {
  const { data } = await client.post(`/suggestions/${id}/dismiss`);
  return data;
};
