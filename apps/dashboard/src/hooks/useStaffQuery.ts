import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@astu/api-client";
import type { StaffUser } from "@astu/shared";
import { API_URL } from "../lib/auth-client";

const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("astu_admin_auth_token");
    }
    return null;
  },
});

export function useStaffQuery() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await apiClient.listStaff();
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [] as StaffUser[];
    },
  });
}

export function useStaffMutations() {
  const qc = useQueryClient();

  const createStaff = useMutation({
    mutationFn: async (input: { name: string; email: string; password?: string; role?: string }) => {
      if (!input.password) {
        throw new Error("Password is required to create a staff member");
      }
      const res = await apiClient.createStaff({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role as any,
      });
      if (!res.success) {
        throw new Error(res.error || "Failed to add staff member");
      }
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const updateStaff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; role?: string; status?: string; password?: string } }) => {
      const res = await apiClient.updateStaff(id, data as any);
      if (!res.success) {
        throw new Error(res.error || "Failed to update staff member");
      }
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.deleteStaff(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete staff member");
      }
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  return {
    createStaff,
    updateStaff,
    deleteStaff,
  };
}
