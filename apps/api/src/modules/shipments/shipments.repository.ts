import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { shipments } from '../../db/schema';
import type { CreateShipmentInput, UpdateShipmentInput } from './shipments.types';

export class ShipmentRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll() {
    return this.db.select().from(shipments).all();
  }

  async findById(id: string) {
    return this.db.select().from(shipments).where(eq(shipments.id, id)).get();
  }

  async findByOrderId(orderId: string) {
    return this.db.select().from(shipments).where(eq(shipments.orderId, orderId)).all();
  }

  async create(data: CreateShipmentInput & { id: string }) {
    const now = new Date().toISOString();
    await this.db.insert(shipments).values({
      ...data,
      shippingCostEtb: data.shippingCostEtb || 0,
      createdAt: now,
      updatedAt: now,
    });
    return this.findById(data.id);
  }

  async update(id: string, data: UpdateShipmentInput) {
    const now = new Date().toISOString();
    await this.db.update(shipments).set({ ...data, updatedAt: now }).where(eq(shipments.id, id));
    return this.findById(id);
  }

  async delete(id: string) {
    return this.db.delete(shipments).where(eq(shipments.id, id));
  }
}
