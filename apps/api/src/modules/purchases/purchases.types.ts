export interface PurchaseOrder {
  id: string;
  supplierId: string;
  warehouseId?: string | null;
  status: string;
  paymentStatus?: string | null;
  accountId?: string | null;
  totalAmountEtb: number;
  taxAmountEtb: number;
  shippingCostEtb: number;
  grnNumber?: string | null;
  notes: string | null;
  expectedDeliveryDate: string | null;
  receivedAt: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  garmentId: string | null;
  description: string;
  category?: string | null;
  quantity: number;
  unitCostEtb: number;
  totalCostEtb: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  warehouseId?: string | null;
  status?: string;
  paymentStatus?: string;
  accountId?: string | null;
  totalAmountEtb?: number;
  taxAmountEtb?: number;
  shippingCostEtb?: number;
  notes?: string | null;
  expectedDeliveryDate?: string | null;
  items: Array<{
    garmentId?: string | null;
    description: string;
    category?: string;
    quantity: number;
    unitCostEtb: number;
    totalCostEtb?: number;
  }>;
}

export interface ReceivePurchaseOrderInput {
  warehouseId?: string;
  accountId?: string;
  payNow?: boolean;
}
