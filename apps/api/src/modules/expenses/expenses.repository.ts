import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../../db';
import { expenses } from '../../db/schema';
import type { CreateExpenseInput } from './expenses.types';

export class ExpenseRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll(filters?: { category?: string; startDate?: string; endDate?: string }) {
    const conditions = [];
    if (filters?.category) conditions.push(eq(expenses.category, filters.category));
    if (filters?.startDate) conditions.push(gte(expenses.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(expenses.date, filters.endDate));

    if (conditions.length > 0) {
      return this.db.select().from(expenses).where(and(...conditions)).all();
    }
    return this.db.select().from(expenses).all();
  }

  async findById(id: string) {
    return this.db.select().from(expenses).where(eq(expenses.id, id)).get();
  }

  async create(data: CreateExpenseInput & { id: string }) {
    const now = new Date().toISOString();
    await this.db.insert(expenses).values({ ...data, createdAt: now });
    return this.findById(data.id);
  }

  async delete(id: string) {
    return this.db.delete(expenses).where(eq(expenses.id, id));
  }

  async getSummary() {
    const all = await this.findAll();
    const totalExpenses = all.reduce((sum, e) => sum + e.amountEtb, 0);
    const byCategory = all.reduce((acc, e) => {
      const existing = acc.find((a) => a.category === e.category);
      if (existing) {
        existing.total += e.amountEtb;
        existing.count++;
      } else {
        acc.push({ category: e.category, total: e.amountEtb, count: 1 });
      }
      return acc;
    }, [] as Array<{ category: string; total: number; count: number }>);

    return { totalExpenses, byCategory };
  }
}
