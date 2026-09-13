export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  orderCount: number;
  expenseCount: number;
  averageOrderValue: number;
}

export interface ExpenseBreakdown {
  category: string;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ProfitLossReport {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: ExpenseBreakdown[];
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}
