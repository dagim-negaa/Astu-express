import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getDb } from '../../db';
import { expenses, bankAccounts, financialTransactions } from '../../db/schema';
import type { CreateExpenseInput, Expense } from './expenses.types';

export class ExpenseRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll(filters?: { category?: string; startDate?: string; endDate?: string }): Promise<Expense[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(expenses.category, filters.category));
    if (filters?.startDate) conditions.push(gte(expenses.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(expenses.date, filters.endDate));

    let query = this.db
      .select({
        id: expenses.id,
        category: expenses.category,
        description: expenses.description,
        amountEtb: expenses.amountEtb,
        date: expenses.date,
        paymentMethod: expenses.paymentMethod,
        accountId: expenses.accountId,
        reference: expenses.reference,
        createdAt: expenses.createdAt,
        accountName: bankAccounts.accountName,
      })
      .from(expenses)
      .leftJoin(bankAccounts, eq(expenses.accountId, bankAccounts.id))
      .orderBy(desc(expenses.date));

    if (conditions.length > 0) {
      return (await query.where(and(...conditions)).all()) as Expense[];
    }
    return (await query.all()) as Expense[];
  }

  async findById(id: string): Promise<Expense | null> {
    const res = await this.db
      .select({
        id: expenses.id,
        category: expenses.category,
        description: expenses.description,
        amountEtb: expenses.amountEtb,
        date: expenses.date,
        paymentMethod: expenses.paymentMethod,
        accountId: expenses.accountId,
        reference: expenses.reference,
        createdAt: expenses.createdAt,
        accountName: bankAccounts.accountName,
      })
      .from(expenses)
      .leftJoin(bankAccounts, eq(expenses.accountId, bankAccounts.id))
      .where(eq(expenses.id, id))
      .get();

    return (res as Expense) || null;
  }

  async create(data: CreateExpenseInput & { id: string }) {
    const now = new Date().toISOString();
    const amount = Number(data.amountEtb);

    // If accountId is provided or fallback to default
    let targetAccountId = data.accountId;
    if (!targetAccountId) {
      const defaultAccount = await this.db.select().from(bankAccounts).where(eq(bankAccounts.isDefault, true)).get();
      if (defaultAccount) {
        targetAccountId = defaultAccount.id;
      } else {
        const firstAccount = await this.db.select().from(bankAccounts).get();
        if (firstAccount) targetAccountId = firstAccount.id;
      }
    }

    // Insert expense record
    await this.db.insert(expenses).values({
      id: data.id,
      category: data.category,
      description: data.description,
      amountEtb: amount,
      date: data.date,
      paymentMethod: data.paymentMethod || 'cash',
      accountId: targetAccountId || null,
      reference: data.reference || null,
      createdAt: now,
    }).run();

    // Deduct from bank account and record in financial_transactions
    if (targetAccountId) {
      const targetAcc = await this.db.select().from(bankAccounts).where(eq(bankAccounts.id, targetAccountId)).get();
      if (targetAcc) {
        const newBalance = Math.round((targetAcc.currentBalance - amount) * 100) / 100;
        await this.db
          .update(bankAccounts)
          .set({ currentBalance: newBalance, updatedAt: now })
          .where(eq(bankAccounts.id, targetAccountId))
          .run();

        const txnId = `txn-exp-${data.id}`;
        await this.db.insert(financialTransactions).values({
          id: txnId,
          accountId: targetAccountId,
          type: 'expense',
          amountEtb: -amount,
          balanceAfter: newBalance,
          description: `Expense: ${data.description} (${data.category})`,
          category: data.category,
          referenceId: data.id,
          date: data.date,
          createdAt: now,
        }).run();
      }
    }

    return this.findById(data.id);
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (existing && existing.accountId) {
      const targetAcc = await this.db.select().from(bankAccounts).where(eq(bankAccounts.id, existing.accountId)).get();
      if (targetAcc) {
        const now = new Date().toISOString();
        const restoredBalance = Math.round((targetAcc.currentBalance + existing.amountEtb) * 100) / 100;
        await this.db
          .update(bankAccounts)
          .set({ currentBalance: restoredBalance, updatedAt: now })
          .where(eq(bankAccounts.id, existing.accountId))
          .run();

        const txnId = `txn-rev-${id}`;
        await this.db.insert(financialTransactions).values({
          id: txnId,
          accountId: existing.accountId,
          type: 'deposit',
          amountEtb: existing.amountEtb,
          balanceAfter: restoredBalance,
          description: `Reversal / Deleted Expense: ${existing.description}`,
          category: 'other',
          referenceId: id,
          date: new Date().toISOString().split('T')[0],
          createdAt: now,
        }).run();
      }
    }
    return this.db.delete(expenses).where(eq(expenses.id, id)).run();
  }

  async getSummary() {
    const all = await this.db.select().from(expenses).all();
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
