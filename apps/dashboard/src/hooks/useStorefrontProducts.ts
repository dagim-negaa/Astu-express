import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export function useStorefrontProducts(category?: string, search?: string) {
  return useQuery({
    queryKey: ['storefront-products', category, search],
    queryFn: async () => {
      const result = await apiClient.listGarments({ category, search });
      return result.data || [];
    },
  });
}

export function useStorefrontProduct(id: string) {
  return useQuery({
    queryKey: ['storefront-product', id],
    queryFn: async () => {
      const result = await apiClient.getGarment(id);
      return result.data;
    },
    enabled: !!id,
  });
}
