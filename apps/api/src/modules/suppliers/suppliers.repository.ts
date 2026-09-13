import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { suppliers } from '../../db/schema';
import type { CreateSupplierInput } from './suppliers.types';

export class SupplierRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll() {
    return this.db.select().from(suppliers).all();
  }

  async findById(id: string) {
    return this.db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  }

  async create(data: CreateSupplierInput & { id: string }) {
    const now = new Date().toISOString();
    await this.db.insert(suppliers).values({ ...data, createdAt: now, updatedAt: now });
    return this.findById(data.id);
  }

  async update(id: string, data: Partial<CreateSupplierInput>) {
    const now = new Date().toISOString();
    await this.db.update(suppliers).set({ ...data, updatedAt: now }).where(eq(suppliers.id, id));
    return this.findById(id);
  }

  async delete(id: string) {
    return this.db.delete(suppliers).where(eq(suppliers.id, id));
  }
}
