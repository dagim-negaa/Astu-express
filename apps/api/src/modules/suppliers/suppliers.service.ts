import { SupplierRepository } from './suppliers.repository';
import type { CreateSupplierInput } from './suppliers.types';

export class SupplierService {
  private repo: SupplierRepository;

  constructor(d1: any) {
    this.repo = new SupplierRepository(d1);
  }

  async list() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
  }

  async create(input: CreateSupplierInput) {
    const id = `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.repo.create({ ...input, id });
  }

  async update(id: string, input: Partial<CreateSupplierInput>) {
    await this.getById(id);
    return this.repo.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
