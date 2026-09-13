import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { purchaseOrders, purchaseOrderItems } from '../../db/schema';
import type { CreatePurchaseOrderInput } from './purchases.types';

export class PurchaseRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll() {
    const orders = await this.db.select().from(purchaseOrders).all();
    const result = [];
    for (const order of orders) {
      const items = await this.db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, order.id)).all();
      result.push({ ...order, items });
    }
    return result;
  }

  async findById(id: string) {
    const order = await this.db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).get();
    if (!order) return null;
    const items = await this.db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id)).all();
    return { ...order, items };
  }

  async create(data: CreatePurchaseOrderInput & { id: string }) {
    const now = new Date().toISOString();
    const totalAmount = data.items.reduce((sum, item) => sum + (item.totalCostEtb || item.quantity * item.unitCostEtb), 0);

    await this.db.insert(purchaseOrders).values({
      id: data.id,
      supplierId: data.supplierId,
      status: data.status || 'draft',
      totalAmountEtb: totalAmount,
      taxAmountEtb: data.taxAmountEtb || 0,
      shippingCostEtb: data.shippingCostEtb || 0,
      notes: data.notes || null,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      createdAt: now,
      updatedAt: now,
    });

    for (const item of data.items) {
      const itemId = `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await this.db.insert(purchaseOrderItems).values({
        id: itemId,
        purchaseOrderId: data.id,
        garmentId: item.garmentId || null,
        description: item.description,
        quantity: item.quantity,
        unitCostEtb: item.unitCostEtb,
        totalCostEtb: item.totalCostEtb || item.quantity * item.unitCostEtb,
      });
    }

    return this.findById(data.id);
  }

  async updateStatus(id: string, status: string) {
    const now = new Date().toISOString();
    const updates: any = { status, updatedAt: now };
    if (status === 'received') updates.receivedAt = now;
    await this.db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id));
    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    return this.db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }
}
