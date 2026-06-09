import client from "./client";

export const savePushToken = async (token: string) => {
  await client.post("/notifications/token", { token });
};

export const updatePreferences = async (prefs: { reminderTime?: string; weeklyCheckin?: boolean }) => {
  const { data } = await client.put("/notifications/preferences", prefs);
  return data;
};

export const getPreferences = async () => {
  const { data } = await client.get("/notifications/preferences");
  return data;
};
