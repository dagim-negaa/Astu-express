import { ShipmentRepository } from './shipments.repository';
import type { CreateShipmentInput, UpdateShipmentInput } from './shipments.types';

export class ShipmentService {
  private repo: ShipmentRepository;

  constructor(d1: any) {
    this.repo = new ShipmentRepository(d1);
  }

  async list() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const shipment = await this.repo.findById(id);
    if (!shipment) throw new Error('Shipment not found');
    return shipment;
  }

  async getByOrderId(orderId: string) {
    return this.repo.findByOrderId(orderId);
  }

  async create(input: CreateShipmentInput) {
    const id = `shp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.repo.create({ ...input, id });
  }

  async update(id: string, input: UpdateShipmentInput) {
    await this.getById(id);
    return this.repo.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
