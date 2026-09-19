import { WarehouseRepository } from './warehouse.repository';
import type { CreateWarehouseInput, TransferToProductionInput } from './warehouse.types';

export class WarehouseService {
  private repo: WarehouseRepository;

  constructor(d1: any) {
    this.repo = new WarehouseRepository(d1);
  }

  async listWarehouses() {
    return this.repo.findAllWarehouses();
  }

  async getWarehouseById(id: string) {
    return this.repo.findWarehouseById(id);
  }

  async createWarehouse(data: CreateWarehouseInput) {
    return this.repo.createWarehouse(data);
  }

  async listItems(filters?: { warehouseId?: string; category?: string; availableOnly?: boolean; search?: string }) {
    return this.repo.findItems(filters);
  }

  async getItemById(id: string) {
    return this.repo.findItemById(id);
  }

  async transferToProduction(input: TransferToProductionInput) {
    return this.repo.transferToProduction(input);
  }
}
