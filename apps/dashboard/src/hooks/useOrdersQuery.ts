import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@astu/api-client";
import type { Order, CreateOrderInput, OrderStatus } from "@astu/shared";

import { API_URL } from "../lib/auth-client";
const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("astu_admin_auth_token") : null),
});

export function useOrdersQuery(filter?: { status?: string; customerEmail?: string }) {
  return useQuery({
    queryKey: ["orders", filter],
    queryFn: async () => {
      const res = await apiClient.listOrders();
      if (res.success && Array.isArray(res.data)) {
        let list = res.data;
        if (filter?.status && filter.status !== "all") {
          list = list.filter((o) => o.status === filter.status);
        }
        return list;
      }
      return [] as Order[];
    },
  });
}

export function useOrdersMutations() {
  const qc = useQueryClient();

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, paymentStatus }: { id: string; status?: OrderStatus; paymentStatus?: string }) => {
      const res = await apiClient.updateOrderStatus(id, status, paymentStatus);
      if (!res.success) throw new Error(res.error || "Failed to update order status");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const createOrder = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await apiClient.createOrder(input);
      if (!res.success) throw new Error(res.error || "Failed to place order");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["garments"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    updateOrderStatus,
    createOrder,
  };
}
