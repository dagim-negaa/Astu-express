import { getDb } from '../../db';
import { orders, expenses, garments } from '../../db/schema';

const EXPENSE_LABELS: Record<string, string> = {
  rent: 'Rent & Lease',
  utilities: 'Utilities',
  salaries: 'Salaries & Wages',
  shipping: 'Shipping & Logistics',
  marketing: 'Marketing & Advertising',
  supplies: 'Office Supplies',
  equipment: 'Equipment & Tools',
  maintenance: 'Maintenance & Repairs',
  other: 'Other Expenses',
};

export class FinanceRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async getRevenue() {
    const allOrders = await this.db.select().from(orders).all();
    return allOrders
      .filter((o) => o.paymentStatus === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalPriceEtb, 0);
  }

  async getOrderCount() {
    const allOrders = await this.db.select().from(orders).all();
    return allOrders.length;
  }

  async getCostOfGoodsSold() {
    const allOrders = await this.db.select().from(orders).all();
    const allGarments = await this.db.select().from(garments).all();
    const garmentMap = new Map(allGarments.map((g) => [g.id, g.buyingPriceEtb || 0]));

    let totalCOGS = 0;
    for (const order of allOrders) {
      if (order.paymentStatus === 'paid' || order.status === 'delivered') {
        const items = order.items ? JSON.parse(order.items) : [];
        for (const item of items) {
          const buyingPrice = garmentMap.get(item.productId || item.id) || 0;
          totalCOGS += buyingPrice * (item.quantity || 1);
        }
      }
    }
    return totalCOGS;
  }

  async getExpenses() {
    const allExpenses = await this.db.select().from(expenses).all();
    return allExpenses;
  }

  async getExpenseSummary() {
    const allExpenses = await this.db.select().from(expenses).all();
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amountEtb, 0);

    const byCategory = allExpenses.reduce((acc, e) => {
      const existing = acc.find((a) => a.category === e.category);
      if (existing) {
        existing.total += e.amountEtb;
        existing.count++;
      } else {
        acc.push({
          category: e.category,
          label: EXPENSE_LABELS[e.category] || e.category,
          total: e.amountEtb,
          count: 1,
          percentage: 0,
        });
      }
      return acc;
    }, [] as Array<{ category: string; label: string; total: number; count: number; percentage: number }>);

    byCategory.forEach((c) => {
      c.percentage = totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0;
    });

    return { totalExpenses, byCategory };
  }
}
