import type { Order, CreateOrderInput, OrderItem, OrderStatus, OrderSource } from "@astu/shared";

export interface OrderFilter {
  status?: string;
  customerEmail?: string;
  orderSource?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export type { Order, CreateOrderInput, OrderItem, OrderStatus, OrderSource };
