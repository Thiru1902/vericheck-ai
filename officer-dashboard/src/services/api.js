import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aicte_officer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Demo-Role"] = "officer";
  const userStr = localStorage.getItem("aicte_officer_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) {
        config.headers["X-Demo-User-Id"] = user.id.toString();
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("aicte_officer_token");
        localStorage.removeItem("aicte_officer_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
