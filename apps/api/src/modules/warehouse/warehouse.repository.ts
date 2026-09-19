import { eq, and, gt, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { warehouses, warehouseItems, garments, stores } from '../../db/schema';
import type { CreateWarehouseInput, TransferToProductionInput } from './warehouse.types';

export class WarehouseRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAllWarehouses() {
    const list = await this.db.select().from(warehouses).all();
    // Augment with item count and total valuation
    const augmented = [];
    for (const wh of list) {
      const items = await this.db.select().from(warehouseItems).where(eq(warehouseItems.warehouseId, wh.id)).all();
      const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      const totalValuation = items.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unitCostEtb) || 0)), 0);
      augmented.push({
        ...wh,
        totalItemsCount: items.length,
        totalUnitsInStock: totalUnits,
        totalValuationEtb: totalValuation,
      });
    }
    return augmented;
  }

  async findWarehouseById(id: string) {
    const wh = await this.db.select().from(warehouses).where(eq(warehouses.id, id)).get();
    if (!wh) return null;
    const items = await this.db.select().from(warehouseItems).where(eq(warehouseItems.warehouseId, id)).all();
    const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const totalValuation = items.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unitCostEtb) || 0)), 0);
    return {
      ...wh,
      totalItemsCount: items.length,
      totalUnitsInStock: totalUnits,
      totalValuationEtb: totalValuation,
      items,
    };
  }

  async createWarehouse(data: CreateWarehouseInput) {
    const now = new Date().toISOString();
    const id = `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await this.db.insert(warehouses).values({
      id,
      name: data.name,
      code: data.code.toUpperCase(),
      location: data.location,
      isDefault: Boolean(data.isDefault),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).run();
    return this.findWarehouseById(id);
  }

  async findItems(filters?: { warehouseId?: string; category?: string; availableOnly?: boolean; search?: string }) {
    let all = await this.db.select().from(warehouseItems).all();

    if (filters?.warehouseId && filters.warehouseId !== 'all') {
      all = all.filter((i) => i.warehouseId === filters.warehouseId);
    }

    if (filters?.category && filters.category !== 'all') {
      all = all.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.availableOnly !== false) {
      all = all.filter((i) => Number(i.quantity) > 0);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      all = all.filter(
        (i) =>
          i.itemTitle.toLowerCase().includes(q) ||
          (i.grnNumber && i.grnNumber.toLowerCase().includes(q)) ||
          (i.supplierName && i.supplierName.toLowerCase().includes(q))
      );
    }

    return all;
  }

  async findItemById(id: string) {
    return this.db.select().from(warehouseItems).where(eq(warehouseItems.id, id)).get();
  }

  async transferToProduction(input: TransferToProductionInput) {
    const item = await this.findItemById(input.warehouseItemId);
    if (!item) {
      throw new Error(`Warehouse item "${input.warehouseItemId}" not found`);
    }

    const availableQty = Number(item.quantity) || 0;
    const transferQty = Number(input.transferQuantity) || 1;

    if (transferQty <= 0) {
      throw new Error('Transfer quantity must be at least 1 unit');
    }

    if (transferQty > availableQty) {
      throw new Error(
        `Insufficient quantity in warehouse. Requested: ${transferQty}, Available: ${availableQty} units`
      );
    }

    const now = new Date().toISOString();
    const newQty = availableQty - transferQty;
    const newTransferred = (Number(item.transferredQuantity) || 0) + transferQty;
    const newStatus = newQty === 0 ? 'transferred_to_production' : 'partially_transferred';

    // 1. Decrement Warehouse stock
    await this.db
      .update(warehouseItems)
      .set({
        quantity: newQty,
        transferredQuantity: newTransferred,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(warehouseItems.id, item.id))
      .run();

    // 2. Generate Storefront Product in Garments catalog
    const garmentId = `garment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const category = input.category || item.category || 'rtw';
    const storeId = input.storeId || 'store-1';

    let sku = input.sku;
    if (!sku) {
      const storeObj = await this.db.select().from(stores).where(eq(stores.id, storeId)).get();
      const storeCode = (storeObj?.name || 'STO').slice(0, 3).toUpperCase();
      const catCode = category.slice(0, 3).toUpperCase();
      sku = `ASTU-${storeCode}-${catCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const buyingPrice = Number(item.unitCostEtb) || 0;
    const sellingPrice = Number(input.sellingPriceEtb) || (buyingPrice > 0 ? Math.round(buyingPrice * 1.3) : 1000);
    const profitMargin =
      input.profitMargin !== undefined
        ? Number(input.profitMargin)
        : buyingPrice > 0
        ? Math.round(((sellingPrice - buyingPrice) / buyingPrice) * 100)
        : 30;

    const primaryColor = input.color || (input.colors && input.colors[0]?.name) || 'Standard';
    const primarySize = input.size || (input.sizes && input.sizes[0]) || 'Standard';

    await this.db
      .insert(garments)
      .values({
        id: garmentId,
        sku,
        title: input.title || item.itemTitle,
        category,
        storeId,
        priceEtb: sellingPrice,
        buyingPriceEtb: buyingPrice,
        profitMargin,
        stockQuantity: transferQty,
        initialStock: transferQty,
        status: input.status || 'in_production',
        color: primaryColor,
        size: primarySize,
        colors: input.colors ? JSON.stringify(input.colors) : null,
        sizes: input.sizes ? JSON.stringify(input.sizes) : JSON.stringify([primarySize]),
        materials: null,
        images: input.images ? JSON.stringify(input.images) : input.imageUrl ? JSON.stringify([input.imageUrl]) : null,
        description: input.description || `Transferred from Warehouse (GRN: ${item.grnNumber || 'N/A'})`,
        isFeatured: Boolean(input.isFeatured),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const createdGarment = await this.db.select().from(garments).where(eq(garments.id, garmentId)).get();
    const updatedWarehouseItem = await this.findItemById(item.id);

    return {
      success: true,
      garment: createdGarment,
      warehouseItem: updatedWarehouseItem,
    };
  }
}
