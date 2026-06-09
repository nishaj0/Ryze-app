import client from "./client";
import { User } from "../types";

export const login = async (email: string, password: string) => {
  const { data } = await client.post("/auth/login", { email, password });
  return data as { token: string; user: Partial<User> };
};

export const register = async (email: string, password: string, name?: string) => {
  const { data } = await client.post("/auth/register", { email, password, name });
  return data as { token: string; user: Partial<User> };
};

export const getMe = async () => {
  const { data } = await client.get("/auth/me");
  return data as { user: User };
};

export const updateProfile = async (updates: Partial<User>) => {
  const { data } = await client.put("/auth/me", updates);
  return data as { user: User };
};

export const deleteAccount = async () => {
  await client.delete("/auth/me");
};
