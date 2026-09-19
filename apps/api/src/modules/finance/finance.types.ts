export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'bank' | 'cash' | 'telebirr' | 'cbe_birr';
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountInput {
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType?: 'bank' | 'cash' | 'telebirr' | 'cbe_birr';
  initialBalance?: number;
  isDefault?: boolean;
}

export interface FinancialTransaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'expense' | 'sale_income' | 'supplier_payment' | 'transfer';
  amountEtb: number;
  balanceAfter: number;
  description: string;
  category: string;
  referenceId?: string;
  date: string;
  createdAt: string;
  accountName?: string;
  bankName?: string;
}

export interface FinanceSummary {
  totalLiquidity: number;
  bankBalance: number;
  cashBalance: number;
  telebirrBalance: number;
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
