export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string | null;
  status: string;
  shippingAddress: string;
  shippingCostEtb: number;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  status?: string;
  shippingAddress: string;
  shippingCostEtb?: number;
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  notes?: string | null;
}

export interface UpdateShipmentInput {
  carrier?: string;
  trackingNumber?: string | null;
  status?: string;
  shippingCostEtb?: number;
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  notes?: string | null;
}
