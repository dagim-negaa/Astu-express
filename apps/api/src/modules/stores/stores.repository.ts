import { eq, desc } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb } from "../../db";
import { stores } from "../../db/schema";
import type { StoreLocation, CreateStoreInput } from "@astu/shared";

export class StoreRepository {
  constructor(private d1: D1Database) {}

  private get db() {
    return getDb(this.d1);
  }

  async findAll(): Promise<StoreLocation[]> {
    const records = await this.db.select().from(stores).orderBy(desc(stores.createdAt));
    return records.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      isDefault: Boolean(s.isDefault),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async findById(id: string): Promise<StoreLocation | null> {
    const [s] = await this.db.select().from(stores).where(eq(stores.id, id));
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      location: s.location,
      isDefault: Boolean(s.isDefault),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async create(input: CreateStoreInput): Promise<StoreLocation> {
    const id = `store-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    await this.db.insert(stores).values({
      id,
      name: input.name,
      location: input.location,
      isDefault: Boolean(input.isDefault),
      createdAt: now,
      updatedAt: now,
    });
    const created = await this.findById(id);
    if (!created) throw new Error("Failed to create store record");
    return created;
  }

  async update(id: string, input: Partial<CreateStoreInput>): Promise<StoreLocation | null> {
    const updateValues: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.location !== undefined) updateValues.location = input.location;
    if (input.isDefault !== undefined) updateValues.isDefault = Boolean(input.isDefault);

    await this.db.update(stores).set(updateValues).where(eq(stores.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(stores).where(eq(stores.id, id));
    return true;
  }
}
