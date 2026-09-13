import { createApiClient } from "@astu/api-client";
import { API_URL } from "./auth-client";

export const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("astu_admin_auth_token") : null),
});
