import { PurchaseRepository } from './purchases.repository';
import type { CreatePurchaseOrderInput } from './purchases.types';

export class PurchaseService {
  private repo: PurchaseRepository;

  constructor(d1: any) {
    this.repo = new PurchaseRepository(d1);
  }

  async list() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error('Purchase order not found');
    return order;
  }

  async create(input: CreatePurchaseOrderInput) {
    const id = `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.repo.create({ ...input, id });
  }

  async updateStatus(id: string, status: string) {
    await this.getById(id);
    return this.repo.updateStatus(id, status);
  }

  async receive(id: string) {
    await this.getById(id);
    return this.repo.updateStatus(id, 'received');
  }

  async delete(id: string) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
