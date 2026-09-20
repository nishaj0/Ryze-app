import axios from "axios";
import { API_URL, API_TIMEOUTS } from "../constants";
import { getToken, clearAuth } from "../utils/storage";

const client = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUTS.STANDARD,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = require("../store/authStore");
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default client;
