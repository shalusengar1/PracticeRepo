// src/api/axios.ts
import axios from "axios";
import type { RootState } from "@/store/store";
// Removed: import { store } from "@/store/store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach the token on every request
api.interceptors.request.use(async (config) => { 
  // 1) Try Redux first
  // Use dynamic import to access store lazily
  const store = await import("@/store/store");
  const state = store.store.getState() as RootState;
  const reduxToken = state.auth.user?.token;

  // 2) Fallback to localStorage
  const localToken = localStorage.getItem("token");

  const token = reduxToken || localToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Check if the request data is FormData and set the appropriate Content-Type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);

export default api;
