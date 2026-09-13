import { eq, desc } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb } from "../../db";
import { customers } from "../../db/schema";
import type { Customer, CreateCustomerInput } from "@astu/shared";

export class CustomerRepository {
  constructor(private d1: D1Database) {}

  private get db() {
    return getDb(this.d1);
  }

  async findAll(): Promise<Customer[]> {
    const records = await this.db.select().from(customers).orderBy(desc(customers.createdAt));
    return records.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "N/A",
      ordersCount: c.ordersCount ?? 0,
      totalSpentEtb: c.totalSpentEtb ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const [c] = await this.db.select().from(customers).where(eq(customers.email, email.toLowerCase()));
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "N/A",
      ordersCount: c.ordersCount ?? 0,
      totalSpentEtb: c.totalSpentEtb ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const id = `cust-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    await this.db.insert(customers).values({
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || "N/A",
      ordersCount: 0,
      totalSpentEtb: 0,
      createdAt: now,
      updatedAt: now,
    });
    const created = await this.findByEmail(input.email);
    if (!created) throw new Error("Failed to create customer record");
    return created;
  }
}
