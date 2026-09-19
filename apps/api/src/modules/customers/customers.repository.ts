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

  async syncCustomersFromUsersAndOrders(): Promise<void> {
    const now = new Date().toISOString();
    try {
      // 1. Fetch all customer accounts from `user` table (non-staff)
      const userRows = await this.d1
        .prepare(`
          SELECT id, name, email, phone, createdAt
          FROM user
          WHERE lower(COALESCE(role, 'customer')) NOT IN ('admin', 'manager', 'operator', 'owner')
        `)
        .all<any>();

      if (userRows.results && userRows.results.length > 0) {
        for (const u of userRows.results) {
          const cleanEmail = (u.email || "").trim().toLowerCase();
          if (!cleanEmail) continue;
          const joinedDate = typeof u.createdAt === 'number'
            ? new Date(u.createdAt > 1e11 ? u.createdAt : u.createdAt * 1000).toISOString().split('T')[0]
            : (u.createdAt || now);

          await this.d1
            .prepare(`
              INSERT INTO customers (id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, 0, 0, ?, ?)
              ON CONFLICT(email) DO UPDATE SET
                name = COALESCE(customers.name, excluded.name),
                phone = CASE WHEN customers.phone = 'N/A' OR customers.phone IS NULL THEN excluded.phone ELSE customers.phone END,
                updatedAt = excluded.updatedAt
            `)
            .bind(
              `cust-${u.id.slice(0, 8)}`,
              u.name || cleanEmail.split('@')[0],
              cleanEmail,
              u.phone || "N/A",
              joinedDate,
              now
            )
            .run();
        }
      }

      // 2. Aggregate orders to ensure any customer who placed an order is tracked with true order count & spend
      const orderAggregates = await this.d1
        .prepare(`
          SELECT lower(customerEmail) as email,
                 customerName as name,
                 customerPhone as phone,
                 COUNT(*) as ordersCount,
                 SUM(COALESCE(totalPriceEtb, 0)) as totalSpent
          FROM orders
          WHERE customerEmail IS NOT NULL AND customerEmail != ''
          GROUP BY lower(customerEmail)
        `)
        .all<any>();

      if (orderAggregates.results && orderAggregates.results.length > 0) {
        for (const agg of orderAggregates.results) {
          const cleanEmail = agg.email;
          await this.d1
            .prepare(`
              INSERT INTO customers (id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(email) DO UPDATE SET
                ordersCount = excluded.ordersCount,
                totalSpentEtb = excluded.totalSpentEtb,
                name = COALESCE(customers.name, excluded.name),
                phone = CASE WHEN customers.phone = 'N/A' OR customers.phone IS NULL THEN excluded.phone ELSE customers.phone END,
                updatedAt = excluded.updatedAt
            `)
            .bind(
              `cust-${crypto.randomUUID().slice(0, 8)}`,
              agg.name || cleanEmail.split('@')[0],
              cleanEmail,
              agg.phone || "N/A",
              agg.ordersCount || 0,
              agg.totalSpent || 0,
              now,
              now
            )
            .run();
        }
      }
    } catch (e) {
      console.warn("Customer auto-sync warning:", e);
    }
  }

  async ensureCustomer(data: { name: string; email: string; phone?: string }): Promise<Customer> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = data.phone || "N/A";
    const now = new Date().toISOString();

    await this.d1
      .prepare(`
        INSERT INTO customers (id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 0, 0, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = COALESCE(excluded.name, customers.name),
          phone = CASE WHEN customers.phone = 'N/A' OR customers.phone IS NULL THEN excluded.phone ELSE customers.phone END,
          updatedAt = excluded.updatedAt;
      `)
      .bind(
        `cust-${crypto.randomUUID().slice(0, 8)}`,
        cleanName,
        cleanEmail,
        cleanPhone,
        now,
        now
      )
      .run();

    const existing = await this.findByEmail(cleanEmail);
    if (!existing) throw new Error("Customer sync failed");
    return existing;
  }

  async findAll(): Promise<Customer[]> {
    await this.syncCustomersFromUsersAndOrders();
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
    return this.ensureCustomer(input);
  }
}
