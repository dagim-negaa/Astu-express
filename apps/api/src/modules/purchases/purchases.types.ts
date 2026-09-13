export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: string;
  totalAmountEtb: number;
  taxAmountEtb: number;
  shippingCostEtb: number;
  notes: string | null;
  expectedDeliveryDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  garmentId: string | null;
  description: string;
  quantity: number;
  unitCostEtb: number;
  totalCostEtb: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  status?: string;
  totalAmountEtb?: number;
  taxAmountEtb?: number;
  shippingCostEtb?: number;
  notes?: string | null;
  expectedDeliveryDate?: string | null;
  items: Array<{
    garmentId?: string | null;
    description: string;
    quantity: number;
    unitCostEtb: number;
    totalCostEtb?: number;
  }>;
}
