import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../db';
import { orders, expenses, garments, bankAccounts, financialTransactions, purchaseOrders } from '../../db/schema';
import type { BankAccount, CreateBankAccountInput, FinancialTransaction } from './finance.types';

const EXPENSE_LABELS: Record<string, string> = {
  rent: 'Rent & Lease',
  utilities: 'Utilities',
  salaries: 'Salaries & Wages',
  shipping: 'Shipping & Logistics',
  marketing: 'Marketing & Advertising',
  supplies: 'Office Supplies',
  equipment: 'Equipment & Tools',
  maintenance: 'Maintenance & Repairs',
  procurement: 'Supplier Procurement',
  other: 'Other Expenses',
};

export class FinanceRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  // ============================================================================
  // BANK ACCOUNTS
  // ============================================================================
  async getBankAccounts(): Promise<BankAccount[]> {
    const list = await this.db.select().from(bankAccounts).all();
    return list.map((a) => ({
      id: a.id,
      accountName: a.accountName,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      accountType: a.accountType as any,
      initialBalance: a.initialBalance,
      currentBalance: a.currentBalance,
      currency: a.currency,
      isDefault: Boolean(a.isDefault),
      status: a.status as any,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  async getBankAccountById(id: string): Promise<BankAccount | null> {
    const a = await this.db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).get();
    if (!a) return null;
    return {
      id: a.id,
      accountName: a.accountName,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      accountType: a.accountType as any,
      initialBalance: a.initialBalance,
      currentBalance: a.currentBalance,
      currency: a.currency,
      isDefault: Boolean(a.isDefault),
      status: a.status as any,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async getDefaultBankAccount(): Promise<BankAccount | null> {
    const a = await this.db.select().from(bankAccounts).where(eq(bankAccounts.isDefault, true)).get();
    if (a) {
      return {
        id: a.id,
        accountName: a.accountName,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        accountType: a.accountType as any,
        initialBalance: a.initialBalance,
        currentBalance: a.currentBalance,
        currency: a.currency,
        isDefault: Boolean(a.isDefault),
        status: a.status as any,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    }
    const accounts = await this.getBankAccounts();
    return accounts[0] || null;
  }

  async createBankAccount(input: CreateBankAccountInput & { id: string }): Promise<BankAccount> {
    const now = new Date().toISOString();
    const initial = Number(input.initialBalance) || 0;

    await this.db.insert(bankAccounts).values({
      id: input.id,
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountType: input.accountType || 'bank',
      initialBalance: initial,
      currentBalance: initial,
      currency: 'ETB',
      isDefault: input.isDefault || false,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).run();

    if (initial > 0) {
      await this.recordTransaction({
        accountId: input.id,
        type: 'deposit',
        amountEtb: initial,
        balanceAfter: initial,
        description: `Initial Deposit / Account Opening (${input.accountName})`,
        category: 'working_capital',
        referenceId: 'account-open',
        date: now.split('T')[0],
      });
    }

    const created = await this.getBankAccountById(input.id);
    return created!;
  }

  async updateAccountBalance(accountId: string, deltaEtb: number): Promise<number> {
    const acc = await this.getBankAccountById(accountId);
    if (!acc) throw new Error(`Bank account ${accountId} not found`);

    const newBalance = Math.round((acc.currentBalance + deltaEtb) * 100) / 100;
    const now = new Date().toISOString();

    await this.db
      .update(bankAccounts)
      .set({ currentBalance: newBalance, updatedAt: now })
      .where(eq(bankAccounts.id, accountId))
      .run();

    return newBalance;
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================
  async recordTransaction(data: {
    accountId: string;
    type: 'deposit' | 'withdrawal' | 'expense' | 'sale_income' | 'supplier_payment' | 'transfer';
    amountEtb: number;
    balanceAfter: number;
    description: string;
    category: string;
    referenceId?: string;
    date: string;
  }): Promise<FinancialTransaction> {
    const id = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    await this.db.insert(financialTransactions).values({
      id,
      accountId: data.accountId,
      type: data.type,
      amountEtb: data.amountEtb,
      balanceAfter: data.balanceAfter,
      description: data.description,
      category: data.category,
      referenceId: data.referenceId,
      date: data.date,
      createdAt: now,
    }).run();

    return {
      id,
      ...data,
      createdAt: now,
    };
  }

  async getTransactions(limit = 100): Promise<FinancialTransaction[]> {
    const list = await this.db
      .select({
        id: financialTransactions.id,
        accountId: financialTransactions.accountId,
        type: financialTransactions.type,
        amountEtb: financialTransactions.amountEtb,
        balanceAfter: financialTransactions.balanceAfter,
        description: financialTransactions.description,
        category: financialTransactions.category,
        referenceId: financialTransactions.referenceId,
        date: financialTransactions.date,
        createdAt: financialTransactions.createdAt,
        accountName: bankAccounts.accountName,
        bankName: bankAccounts.bankName,
      })
      .from(financialTransactions)
      .leftJoin(bankAccounts, eq(financialTransactions.accountId, bankAccounts.id))
      .orderBy(desc(financialTransactions.createdAt))
      .limit(limit)
      .all();

    return list as FinancialTransaction[];
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================
  async getRevenue(startDate?: string, endDate?: string) {
    const allOrders = await this.db.select().from(orders).all();
    return allOrders
      .filter((o) => {
        const isPaid = (o.paymentStatus || '').toLowerCase() === 'paid' || o.status === 'delivered';
        if (!isPaid) return false;
        const date = (o.paidAt || o.createdAt || '').split('T')[0];
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      })
      .reduce((sum, o) => sum + (Number(o.totalPriceEtb) || 0), 0);
  }

  async getOrderCount(startDate?: string, endDate?: string) {
    const allOrders = await this.db.select().from(orders).all();
    return allOrders.filter((o) => {
      const date = (o.createdAt || '').split('T')[0];
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    }).length;
  }

  async getCostOfGoodsSold(startDate?: string, endDate?: string) {
    const allOrders = await this.db.select().from(orders).all();
    const allGarments = await this.db.select().from(garments).all();
    const garmentMap = new Map(allGarments.map((g) => [g.id, g.buyingPriceEtb || 0]));

    let totalCOGS = 0;
    for (const order of allOrders) {
      const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid' || order.status === 'delivered';
      if (!isPaid) continue;
      const date = (order.paidAt || order.createdAt || '').split('T')[0];
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      let items: any[] = [];
      if (order.items) {
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch {
          items = [];
        }
      }
      for (const item of items) {
        const buyingPrice = garmentMap.get(item.productId || item.id) || 0;
        totalCOGS += buyingPrice * (item.quantity || 1);
      }
    }
    return totalCOGS;
  }

  async getExpenses(startDate?: string, endDate?: string) {
    const allExpenses = await this.db.select().from(expenses).all();
    if (!startDate && !endDate) return allExpenses;
    return allExpenses.filter((e) => {
      const d = e.date || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  async getExpenseSummary(startDate?: string, endDate?: string) {
    const allExpenses = await this.getExpenses(startDate, endDate);
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
