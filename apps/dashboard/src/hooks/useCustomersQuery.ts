import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@astu/api-client";
import type { Customer } from "@astu/shared";

import { API_URL } from "../lib/auth-client";
const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("astu_admin_auth_token") : null),
});

export function useCustomersQuery() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiClient.listCustomers();
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [] as Customer[];
    },
  });
}
