import { eq, desc, and, sql } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb } from "../../db";
import { garments } from "../../db/schema";
import type { Garment, CreateGarmentInput, CatalogFilter } from "./catalog.types";

export function serializeJsonField(val: any): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return null;
  }
}


export function parseJsonField<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export function formatGarmentRecord(g: any): Garment {
  const isFeatured = Boolean(g.isFeatured ?? g.is_featured ?? false);
  let images = parseJsonField<string[]>(g.images, g.imageUrl ? [g.imageUrl] : []);
  const colors = parseJsonField<any[]>(g.colors, g.color ? [{ name: g.color, hex: "#845400" }] : []);
  const sizes = parseJsonField<any[]>(g.sizes, g.size ? [{ label: g.size, available: true }] : []);
  const materials = parseJsonField<string[]>(g.materials, typeof g.materials === "string" ? [g.materials] : []);

  // Aggregate angle images across colors if images array is empty
  const angleImages: string[] = [];
  if (Array.isArray(colors)) {
    for (const c of colors) {
      if (c && typeof c === 'object' && c.images) {
        if (c.images.front && !angleImages.includes(c.images.front)) angleImages.push(c.images.front);
        if (c.images.back && !angleImages.includes(c.images.back)) angleImages.push(c.images.back);
        if (c.images.side && !angleImages.includes(c.images.side)) angleImages.push(c.images.side);
      }
    }
  }

  if (images.length === 0 && angleImages.length > 0) {
    images = angleImages;
  }

  const primaryCover = (colors[0]?.images?.front) || images[0] || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

  return {
    id: g.id,
    sku: g.sku,
    title: g.title,
    name: g.title,
    category: g.category,
    storeId: g.storeId ?? null,
    priceEtb: g.priceEtb,
    price: g.priceEtb,
    buyingPriceEtb: g.buyingPriceEtb ?? null,
    buyingPrice: g.buyingPriceEtb ?? null,
    profitMargin: g.profitMargin ?? null,
    stockQuantity: g.stockQuantity ?? 0,
    quantity: g.stockQuantity ?? 0,
    initialStock: g.initialStock ?? g.stockQuantity ?? 0,
    status: g.status || "draft",
    color: g.color || (colors[0]?.name ?? "Standard"),
    size: g.size || "Standard",
    colors,
    sizes,
    materials,
    images: images.length > 0 ? images : [primaryCover],
    imageUrl: primaryCover,
    description: g.description ?? null,
    notes: g.description ?? null,
    isFeatured,
    is_featured: isFeatured,
    createdAt: g.createdAt || new Date().toISOString(),
    updatedAt: g.updatedAt || new Date().toISOString(),
  } as any;
}

export class CatalogRepository {
  constructor(private d1: D1Database) {}

  private get db() {
    return getDb(this.d1);
  }

  async findAll(filter?: CatalogFilter): Promise<Garment[]> {
    const conditions = [];

    if (filter?.category && filter.category !== "all" && filter.category !== "All") {
      conditions.push(eq(sql`lower(${garments.category})`, filter.category.trim().toLowerCase()));
    }

    if (filter?.search && filter.search.trim().length > 0) {
      const q = `%${filter.search.trim().toLowerCase()}%`;
      conditions.push(
        sql`(lower(${garments.title}) LIKE ${q} OR lower(${garments.sku}) LIKE ${q} OR lower(COALESCE(${garments.description}, '')) LIKE ${q})`
      );
    }

    if (filter?.storeId && filter.storeId !== "all" && filter.storeId !== "All") {
      conditions.push(eq(garments.storeId, filter.storeId));
    }

    if (filter?.isFeatured !== undefined) {
      conditions.push(eq(garments.isFeatured, filter.isFeatured));
    }

    if (filter?.material || filter?.materials) {
      const m = `%${(filter.material || filter.materials)!.trim().toLowerCase()}%`;
      conditions.push(sql`lower(COALESCE(${garments.materials}, '')) LIKE ${m}`);
    }

    const limit = filter?.limit ? Math.min(Math.max(1, Number(filter.limit)), 100) : 50;
    const offset = filter?.offset
      ? Math.max(0, Number(filter.offset))
      : (filter?.page && Number(filter.page) > 1 ? (Number(filter.page) - 1) * limit : 0);

    let query = this.db.select().from(garments);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const records = await query
      .orderBy(desc(garments.createdAt))
      .limit(limit)
      .offset(offset);

    return records.map(formatGarmentRecord);
  }

  async findById(id: string): Promise<Garment | null> {
    const [record] = await this.db.select().from(garments).where(eq(garments.id, id));
    if (!record) return null;
    return formatGarmentRecord(record);
  }

  async findBySku(sku: string): Promise<Garment | null> {
    const [record] = await this.db.select().from(garments).where(eq(garments.sku, sku));
    if (!record) return null;
    return formatGarmentRecord(record);
  }

  async create(input: CreateGarmentInput & { id?: string; materials?: any; material?: any }): Promise<Garment> {
    const id = input.id || `garment-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const price = input.priceEtb ?? input.price ?? 0;
    const buyingPrice = input.buyingPriceEtb ?? input.buyingPrice ?? null;
    const stock = input.stockQuantity ?? input.quantity ?? 0;
    const initial = input.initialStock ?? stock;
    const title = input.title || input.name || "Handcrafted Garment";
    const isFeatured = Boolean(input.isFeatured ?? input.is_featured ?? false);

    const imagesSerialized = serializeJsonField(input.images || (input.imageUrl ? [input.imageUrl] : []));
    const colorsSerialized = serializeJsonField(input.colors || (input.color ? [{ name: input.color, hex: "#845400" }] : []));
    const sizesSerialized = serializeJsonField(input.sizes || (input.size ? [{ label: input.size, available: true }] : []));
    const materialsSerialized = serializeJsonField(input.materials || input.material || null);

    await this.db.insert(garments).values({
      id,
      sku: input.sku,
      title,
      category: input.category,
      storeId: input.storeId || null,
      priceEtb: price,
      buyingPriceEtb: buyingPrice,
      profitMargin: input.profitMargin ?? null,
      stockQuantity: stock,
      initialStock: initial,
      status: input.status || "draft",
      color: input.color || "Standard",
      size: input.size || "Standard",
      colors: colorsSerialized,
      sizes: sizesSerialized,
      materials: materialsSerialized,
      images: imagesSerialized,
      description: input.description || input.notes || null,
      isFeatured,
      createdAt: now,
      updatedAt: now,
    });
    const created = await this.findById(id);
    if (!created) throw new Error("Failed to retrieve created garment");
    return created;
  }

  async updateStock(id: string, newStockQuantity: number, newInitialStock?: number): Promise<Garment | null> {
    const updateValues: Record<string, any> = {
      stockQuantity: Math.max(0, newStockQuantity),
      updatedAt: new Date().toISOString(),
    };
    if (newInitialStock !== undefined && newInitialStock > 0) {
      updateValues.initialStock = newInitialStock;
    }

    await this.db.update(garments).set(updateValues).where(eq(garments.id, id));
    return this.findById(id);
  }

  async toggleSpotlight(id: string, isFeaturedExplicit?: boolean): Promise<{ success: boolean; isFeatured: boolean; id: string }> {
    const target = await this.findById(id);
    if (!target) throw new Error("Garment not found");

    const nextState = isFeaturedExplicit !== undefined ? Boolean(isFeaturedExplicit) : !target.isFeatured;
    await this.db
      .update(garments)
      .set({
        isFeatured: nextState,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(garments.id, id));

    return {
      success: true,
      isFeatured: nextState,
      id,
    };
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(garments).where(eq(garments.id, id));
    return true;
  }

  async clearAll(): Promise<boolean> {
    await this.db.delete(garments);
    return true;
  }
}
