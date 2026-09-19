import { FinanceRepository } from './finance.repository';
import type { CreateBankAccountInput } from './finance.types';

export class FinanceService {
  private repo: FinanceRepository;

  constructor(d1: any) {
    this.repo = new FinanceRepository(d1);
  }

  // ============================================================================
  // BANK ACCOUNTS
  // ============================================================================
  async listAccounts() {
    return this.repo.getBankAccounts();
  }

  async getAccountById(id: string) {
    return this.repo.getBankAccountById(id);
  }

  async createAccount(input: CreateBankAccountInput) {
    const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return this.repo.createBankAccount({ ...input, id });
  }

  async deposit(data: { accountId: string; amountEtb: number; description: string; category?: string; date?: string }) {
    if (data.amountEtb <= 0) throw new Error('Deposit amount must be greater than zero');
    const newBalance = await this.repo.updateAccountBalance(data.accountId, data.amountEtb);
    return this.repo.recordTransaction({
      accountId: data.accountId,
      type: 'deposit',
      amountEtb: data.amountEtb,
      balanceAfter: newBalance,
      description: data.description || 'Deposit / Capital Addition',
      category: data.category || 'working_capital',
      date: data.date || new Date().toISOString().split('T')[0],
    });
  }

  async transfer(data: { fromAccountId: string; toAccountId: string; amountEtb: number; description?: string; date?: string }) {
    if (data.fromAccountId === data.toAccountId) {
      throw new Error('Source and destination accounts must be different');
    }
    if (data.amountEtb <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }

    const fromAcc = await this.repo.getBankAccountById(data.fromAccountId);
    if (!fromAcc) throw new Error('Source bank account not found');
    if (fromAcc.currentBalance < data.amountEtb) {
      throw new Error(`Insufficient funds: ${fromAcc.accountName} only has ETB ${fromAcc.currentBalance.toLocaleString()}`);
    }

    const toAcc = await this.repo.getBankAccountById(data.toAccountId);
    if (!toAcc) throw new Error('Destination bank account not found');

    const date = data.date || new Date().toISOString().split('T')[0];
    const desc = data.description || `Transfer: ${fromAcc.accountName} → ${toAcc.accountName}`;

    // Deduct from source
    const fromNewBal = await this.repo.updateAccountBalance(data.fromAccountId, -data.amountEtb);
    await this.repo.recordTransaction({
      accountId: data.fromAccountId,
      type: 'transfer',
      amountEtb: -data.amountEtb,
      balanceAfter: fromNewBal,
      description: `Outward ${desc}`,
      category: 'transfer',
      referenceId: toAcc.id,
      date,
    });

    // Add to destination
    const toNewBal = await this.repo.updateAccountBalance(data.toAccountId, data.amountEtb);
    await this.repo.recordTransaction({
      accountId: data.toAccountId,
      type: 'transfer',
      amountEtb: data.amountEtb,
      balanceAfter: toNewBal,
      description: `Inward ${desc}`,
      category: 'transfer',
      referenceId: fromAcc.id,
      date,
    });

    return {
      success: true,
      transferred: data.amountEtb,
      fromAccount: { id: fromAcc.id, name: fromAcc.accountName, newBalance: fromNewBal },
      toAccount: { id: toAcc.id, name: toAcc.accountName, newBalance: toNewBal },
    };
  }

  async listTransactions(limit = 100) {
    return this.repo.getTransactions(limit);
  }

  // ============================================================================
  // DASHBOARD & SUMMARY
  // ============================================================================
  async getDashboard() {
    const [accounts, totalRevenue, totalExpenses, orderCount, expenseSummary, costOfGoodsSold, recentTransactions] = await Promise.all([
      this.repo.getBankAccounts(),
      this.repo.getRevenue(),
      this.repo.getExpenses().then((e) => e.reduce((sum, exp) => sum + exp.amountEtb, 0)),
      this.repo.getOrderCount(),
      this.repo.getExpenseSummary(),
      this.repo.getCostOfGoodsSold(),
      this.repo.getTransactions(10),
    ]);

    const totalLiquidity = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const bankBalance = accounts.filter((a) => a.accountType === 'bank').reduce((sum, a) => sum + a.currentBalance, 0);
    const cashBalance = accounts.filter((a) => a.accountType === 'cash').reduce((sum, a) => sum + a.currentBalance, 0);
    const telebirrBalance = accounts.filter((a) => a.accountType === 'telebirr' || a.accountType === 'cbe_birr').reduce((sum, a) => sum + a.currentBalance, 0);

    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    return {
      totalLiquidity,
      bankBalance,
      cashBalance,
      telebirrBalance,
      accounts,
      totalRevenue,
      totalExpenses,
      costOfGoodsSold,
      grossProfit,
      netProfit,
      profitMargin,
      orderCount,
      expenseCount: expenseSummary.byCategory.reduce((sum, c) => sum + c.count, 0),
      averageOrderValue,
      expensesByCategory: expenseSummary.byCategory,
      recentTransactions,
    };
  }

  async getProfitLoss(startDate?: string, endDate?: string) {
    const allExpenses = await this.repo.getExpenses(startDate, endDate);
    const totalRevenue = await this.repo.getRevenue(startDate, endDate);
    const costOfGoodsSold = await this.repo.getCostOfGoodsSold(startDate, endDate);
    const orderCount = await this.repo.getOrderCount(startDate, endDate);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amountEtb, 0);
    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    const expenseBreakdown = allExpenses.reduce((acc, e) => {
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

    expenseBreakdown.forEach((c) => {
      c.percentage = totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0;
    });

    return {
      period: startDate && endDate ? `${startDate} to ${endDate}` : (startDate ? `From ${startDate}` : 'All Time'),
      revenue: totalRevenue,
      costOfGoodsSold,
      grossProfit,
      grossMargin,
      expenses: expenseBreakdown,
      totalExpenses,
      netProfit,
      profitMargin,
      orderCount,
    };
  }
}

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
