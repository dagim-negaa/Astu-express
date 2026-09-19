import type { Order, CreateOrderInput, OrderItem, OrderStatus, OrderSource } from "@astu/shared";

export interface OrderFilter {
  status?: string;
  customerEmail?: string;
  trackingNumber?: string;
  query?: string;
  q?: string;
  orderSource?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export type { Order, CreateOrderInput, OrderItem, OrderStatus, OrderSource };
