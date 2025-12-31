import axios from "axios";

export const loopbackApi = axios.create({
  baseURL: import.meta.env.VITE_LOOPBACK_API_BASE_URL ?? "http://localhost:3000",
  timeout: 150000,
});

// Optional (but handy): normalize LoopBack errors
loopbackApi.interceptors.response.use(
  (res) => res,
  (err) => {
    // you can later map err.response?.data?.error?.message etc.
    return Promise.reject(err);
  }
);
