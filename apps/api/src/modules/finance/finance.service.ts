import { FinanceRepository } from './finance.repository';

export class FinanceService {
  private repo: FinanceRepository;

  constructor(d1: any) {
    this.repo = new FinanceRepository(d1);
  }

  async getDashboard() {
    const [totalRevenue, totalExpenses, orderCount, expenseSummary, costOfGoodsSold] = await Promise.all([
      this.repo.getRevenue(),
      this.repo.getExpenses().then((e) => e.reduce((sum, exp) => sum + exp.amountEtb, 0)),
      this.repo.getOrderCount(),
      this.repo.getExpenseSummary(),
      this.repo.getCostOfGoodsSold(),
    ]);

    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    return {
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
    };
  }

  async getProfitLoss(startDate?: string, endDate?: string) {
    const allExpenses = await this.repo.getExpenses();
    const totalRevenue = await this.repo.getRevenue();
    const costOfGoodsSold = await this.repo.getCostOfGoodsSold();

    let filteredExpenses = allExpenses;
    if (startDate) filteredExpenses = filteredExpenses.filter((e) => e.date >= startDate);
    if (endDate) filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amountEtb, 0);
    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    const expenseBreakdown = filteredExpenses.reduce((acc, e) => {
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
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time',
      revenue: totalRevenue,
      costOfGoodsSold,
      grossProfit,
      expenses: expenseBreakdown,
      totalExpenses,
      netProfit,
      profitMargin,
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
  other: 'Other Expenses',
};
