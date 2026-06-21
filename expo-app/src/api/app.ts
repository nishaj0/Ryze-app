import client from "./client";

export interface AppSettings {
  id: string;
  bugReportingEnabled: boolean;
  helpRequestsEnabled: boolean;
  exerciseRequestsEnabled: boolean;
}

export const getAppSettings = async (): Promise<AppSettings> => {
  const { data } = await client.get<{ settings: AppSettings }>("/app/settings");
  return data.settings;
};
