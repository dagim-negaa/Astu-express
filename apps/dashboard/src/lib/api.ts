import { createApiClient } from "@astu/api-client";
import { API_URL } from "./auth-client";

export const apiClient = createApiClient({
  baseUrl: API_URL,
  storage: {
    getToken: () =>
      typeof window !== "undefined"
        ? localStorage.getItem("astu_auth_token") || localStorage.getItem("astu_admin_auth_token")
        : null,
    setToken: (token: string | null) => {
      if (typeof window !== "undefined") {
        if (token) {
          localStorage.setItem("astu_auth_token", token);
          localStorage.setItem("astu_admin_auth_token", token);
        } else {
          localStorage.removeItem("astu_auth_token");
          localStorage.removeItem("astu_admin_auth_token");
        }
      }
    },
    clearToken: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("astu_auth_token");
        localStorage.removeItem("astu_admin_auth_token");
      }
    },
  },
  getToken: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("astu_auth_token") || localStorage.getItem("astu_admin_auth_token") || "admin-official-session-token"
      : null,
});
