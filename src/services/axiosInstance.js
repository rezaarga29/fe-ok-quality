import axios from "axios";
import { useAuthStore } from "./authStore";

const API = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true,
});

// ── Response interceptor: 401 → auto logout ──────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearUser();
      window.location.href = `${API}/auth/logout`;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
