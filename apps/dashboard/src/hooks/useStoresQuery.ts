import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@astu/api-client";
import type { StoreLocation } from "@astu/shared";

import { API_URL } from "../lib/auth-client";
const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("astu_admin_auth_token") : null),
});

export function useStoresQuery() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const res = await apiClient.listStores();
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [] as StoreLocation[];
    },
  });
}

export function useStoresMutations() {
  const qc = useQueryClient();

  const createStore = useMutation({
    mutationFn: async ({ name, location }: { name: string; location: string }) => {
      const res = await apiClient.createStore(name, location);
      if (!res.success) throw new Error(res.error || "Failed to create store");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; location: string; isDefault: boolean }> }) => {
      const res = await apiClient.updateStore(id, data);
      if (!res.success) throw new Error(res.error || "Failed to update store");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.deleteStore(id);
      if (!res.success) throw new Error(res.error || "Failed to delete store");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
      qc.invalidateQueries({ queryKey: ["garments"] });
    },
  });

  return { createStore, updateStore, deleteStore };
}
