export interface Expense {
  id: string;
  category: string;
  description: string;
  amountEtb: number;
  date: string;
  paymentMethod: string;
  reference: string | null;
  createdAt: string;
}

export interface CreateExpenseInput {
  category: string;
  description: string;
  amountEtb: number;
  date: string;
  paymentMethod?: string;
  reference?: string | null;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}
