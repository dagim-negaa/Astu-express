import type { CustomerRepository } from "./customers.repository";
import type { Customer, CreateCustomerInput } from "@astu/shared";

export class CustomerService {
  constructor(private repo: CustomerRepository) {}

  async listCustomers(): Promise<Customer[]> {
    return this.repo.findAll();
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      return existing;
    }
    return this.repo.create(input);
  }
}
