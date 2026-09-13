import type { OrderRepository } from "./orders.repository";
import type { Order, CreateOrderInput, OrderFilter } from "./orders.types";

export class OrderService {
  constructor(private repo: OrderRepository) {}

  async listOrders(filter?: OrderFilter): Promise<Order[]> {
    return this.repo.findAll(filter);
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.repo.findById(id);
  }

  async createOrder(input: CreateOrderInput, items?: any[]): Promise<Order> {
    if (!input.customerEmail) {
      throw new Error("Customer email is required to place an order");
    }
    const orderItems = (items && items.length > 0) ? items : (input.items && input.items.length > 0 ? input.items : []);
    if (!input.garmentTitle && !input.garmentSku && orderItems.length === 0) {
      throw new Error("Order must contain at least one item or garment title");
    }

    return this.repo.createWithStockDecrement(input, orderItems);
  }

  async updateStatus(id: string, status?: string, paymentStatus?: string): Promise<Order> {
    const updated = await this.repo.updateStatus(id, status, paymentStatus);
    if (!updated) throw new Error("Order not found");
    return updated;
  }

  async findByTxRef(txRef: string): Promise<Order | null> {
    return this.repo.findByTxRef(txRef);
  }

  async updatePaymentSuccess(
    id: string,
    paymentReference?: string,
    paymentProvider?: string,
    paidAt?: string
  ): Promise<Order> {
    const updated = await this.repo.updatePaymentSuccess(id, paymentReference, paymentProvider, paidAt);
    if (!updated) throw new Error("Order not found");
    return updated;
  }

  async confirmReceipt(id: string): Promise<Order> {
    const updated = await this.repo.confirmReceipt(id);
    if (!updated) throw new Error("Order not found");
    return updated;
  }

  async updatePaymentFailed(id: string): Promise<Order> {
    const updated = await this.repo.updatePaymentFailed(id);
    if (!updated) throw new Error("Order not found");
    return updated;
  }
}
