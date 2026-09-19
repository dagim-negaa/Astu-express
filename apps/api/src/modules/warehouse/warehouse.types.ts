export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  isDefault: boolean | number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseItem {
  id: string;
  warehouseId: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  grnNumber?: string | null;
  itemTitle: string;
  category: string;
  quantity: number;
  receivedQuantity: number;
  transferredQuantity: number;
  unitCostEtb: number;
  totalCostEtb: number;
  status: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  location: string;
  isDefault?: boolean;
}

export interface TransferToProductionInput {
  warehouseItemId: string;
  storeId: string;
  category?: string;
  transferQuantity: number;
  sellingPriceEtb: number;
  profitMargin?: number;
  title?: string;
  description?: string;
  sku?: string;
  color?: string;
  size?: string;
  colors?: any[];
  sizes?: string[];
  images?: string[];
  imageUrl?: string;
  status?: string;
  isFeatured?: boolean;
}
