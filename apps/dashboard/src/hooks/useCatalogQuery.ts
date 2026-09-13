import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@astu/api-client";
import type { Garment, CreateGarmentInput } from "@astu/shared";

import { API_URL } from "../lib/auth-client";
const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("astu_admin_auth_token") : null),
});

export interface CatalogFilter {
  category?: string;
  search?: string;
  storeId?: string;
}

export function useCatalogQuery(filter?: CatalogFilter) {
  return useQuery({
    queryKey: ["garments", filter],
    queryFn: async () => {
      const res = await apiClient.listGarments(filter);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [] as Garment[];
    },
  });
}

export function useCatalogMutations() {
  const qc = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (input: CreateGarmentInput) => {
      const res = await apiClient.createGarment(input);
      if (!res.success) throw new Error(res.error || "Failed to create garment");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["garments"] });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, quantity, initialStock }: { id: string; quantity: number; initialStock?: number }) => {
      const res = await apiClient.updateStock(id, quantity, initialStock);
      if (!res.success) throw new Error(res.error || "Failed to update stock");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["garments"] });
    },
  });

  const toggleSpotlight = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured?: boolean }) => {
      const res = await apiClient.toggleSpotlight(id, isFeatured);
      if (!res.success) throw new Error(res.error || "Failed to toggle spotlight");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["garments"] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.deleteGarment(id);
      if (!res.success) throw new Error(res.error || "Failed to delete garment");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["garments"] });
    },
  });

  return {
    createProduct,
    updateStock,
    toggleSpotlight,
    deleteProduct,
  };
}
