import { ExpenseRepository } from './expenses.repository';
import type { CreateExpenseInput } from './expenses.types';

export class ExpenseService {
  private repo: ExpenseRepository;

  constructor(d1: any) {
    this.repo = new ExpenseRepository(d1);
  }

  async list(filters?: { category?: string; startDate?: string; endDate?: string }) {
    return this.repo.findAll(filters);
  }

  async getSummary() {
    return this.repo.getSummary();
  }

  async create(input: CreateExpenseInput) {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.repo.create({ ...input, id });
  }

  async delete(id: string) {
    const expense = await this.repo.findById(id);
    if (!expense) throw new Error('Expense not found');
    return this.repo.delete(id);
  }
}
