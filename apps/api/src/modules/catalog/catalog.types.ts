import type { Garment, CreateGarmentInput, GarmentStatus } from "@astu/shared";

export interface CatalogFilter {
  category?: string;
  search?: string;
  storeId?: string;
  isFeatured?: boolean;
  material?: string;
  materials?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export type { Garment, CreateGarmentInput, GarmentStatus };
