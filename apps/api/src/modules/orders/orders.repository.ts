import { eq, desc, and, sql } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { getDb } from "../../db";
import { orders } from "../../db/schema";
import type { Order, CreateOrderInput, OrderFilter } from "./orders.types";

export function formatOrderRecord(o: any): Order {
  let parsedItems: any = undefined;
  if (o.items) {
    try {
      parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
    } catch {
      parsedItems = undefined;
    }
  }

  return {
    id: o.id,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone ?? undefined,
    garmentTitle: o.garmentTitle,
    garmentSku: o.garmentSku,
    quantity: o.quantity ?? 1,
    items: parsedItems,
    totalPriceEtb: o.totalPriceEtb,
    totalPrice: o.totalPriceEtb,
    paymentMethod: o.paymentMethod || "Mobile Transfer",
    paymentStatus: o.paymentStatus || "unpaid",
    paymentTxRef: o.paymentTxRef ?? undefined,
    paymentReference: o.paymentReference ?? undefined,
    paymentProvider: o.paymentProvider ?? undefined,
    paidAt: o.paidAt ?? undefined,
    deliveredAt: o.deliveredAt ?? undefined,
    confirmedReceiptAt: o.confirmedReceiptAt ?? undefined,
    deliveryFee: o.deliveryFee != null ? Number(o.deliveryFee) : 0,
    promoCode: o.promoCode ?? undefined,
    discountEtb: o.discountEtb != null ? Number(o.discountEtb) : 0,
    status: o.status || "pending",
    shippingAddress: o.shippingAddress || "Addis Ababa, Ethiopia",
    orderSource: o.orderSource || "phone",
    storeId: o.storeId || undefined,
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || new Date().toISOString(),
  };
}

export class OrderRepository {
  constructor(private d1: D1Database) {}

  private get db() {
    return getDb(this.d1);
  }

  async findAll(filter?: OrderFilter): Promise<Order[]> {
    const conditions = [];

    if (filter?.status && filter.status !== "all" && filter.status !== "All") {
      conditions.push(eq(orders.status, filter.status));
    }
    if (filter?.customerEmail) {
      conditions.push(eq(sql`lower(${orders.customerEmail})`, filter.customerEmail.trim().toLowerCase()));
    }
    if (filter?.orderSource) {
      conditions.push(eq(orders.orderSource, filter.orderSource));
    }
    if (filter?.storeId && filter.storeId !== "all" && filter.storeId !== "All") {
      conditions.push(eq(orders.storeId, filter.storeId));
    }

    const limit = filter?.limit ? Math.min(Math.max(1, Number(filter.limit)), 100) : 50;
    const offset = filter?.offset
      ? Math.max(0, Number(filter.offset))
      : (filter?.page && Number(filter.page) > 1 ? (Number(filter.page) - 1) * limit : 0);

    let query = this.db.select().from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const records = await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return records.map(formatOrderRecord);
  }

  async findById(id: string): Promise<Order | null> {
    const [record] = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!record) return null;
    return formatOrderRecord(record);
  }

  async createWithStockDecrement(input: CreateOrderInput, items?: any[]): Promise<Order> {
    const orderId = input.id || `ord-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const customerEmail = (input.customerEmail || "").trim().toLowerCase();
    const customerName = (input.customerName || "Valued Client").trim();
    const totalPrice = input.totalPriceEtb ?? 0;
    const qty = input.quantity || 1;
    const rawOrderItems: any[] = (items && items.length > 0) ? items : (input.items && input.items.length > 0 ? input.items : []);
    let primaryStoreId: string | null = input.storeId || null;
    let calculatedAuthoritativeTotal = 0;

    // 1. Atomic Pre-Check: Validate stock availability, resolve prices, and resolve garment store IDs
    const resolvedItems: any[] = [];
    if (rawOrderItems.length > 0) {
      for (const item of rawOrderItems) {
        const itemQty = Number(item.quantity) || 1;
        const targetId = item.productId || item.id;
        let garment: any = null;

        if (targetId) {
          garment = await this.d1
            .prepare("SELECT id, sku, title, storeId, stockQuantity, priceEtb FROM garments WHERE id = ? LIMIT 1")
            .bind(targetId)
            .first();
        } else if (item.sku) {
          garment = await this.d1
            .prepare("SELECT id, sku, title, storeId, stockQuantity, priceEtb FROM garments WHERE sku = ? LIMIT 1")
            .bind(item.sku)
            .first();
        }

        if (garment) {
          if ((garment.stockQuantity ?? 0) < itemQty) {
            throw new Error(
              `Insufficient stock for "${garment.title || item.title || garment.sku}". Available: ${garment.stockQuantity}, requested: ${itemQty}`
            );
          }
          if (!primaryStoreId && garment.storeId) {
            primaryStoreId = garment.storeId;
          }
          const unitPrice = Number(garment.priceEtb) || Number(item.priceEtb) || Number(item.price) || 0;
          calculatedAuthoritativeTotal += unitPrice * itemQty;
          item.priceEtb = unitPrice;
        } else {
          const fallbackPrice = Number(item.priceEtb) || Number(item.price) || 0;
          calculatedAuthoritativeTotal += fallbackPrice * itemQty;
        }

        resolvedItems.push({
          ...item,
          storeId: item.storeId || garment?.storeId || primaryStoreId || null,
        });
      }
    } else if (input.garmentSku) {
      const garment: any = await this.d1
        .prepare("SELECT id, sku, title, storeId, stockQuantity, priceEtb FROM garments WHERE sku = ? LIMIT 1")
        .bind(input.garmentSku)
        .first();

      if (garment && (garment.stockQuantity ?? 0) < qty) {
        throw new Error(
          `Insufficient stock for "${garment.title || input.garmentSku}". Available: ${garment.stockQuantity}, requested: ${qty}`
        );
      }
      if (garment?.storeId) {
        primaryStoreId = garment.storeId;
      }
      if (garment?.priceEtb) {
        calculatedAuthoritativeTotal += Number(garment.priceEtb) * qty;
      }
    }

    const verifiedTotalPrice = calculatedAuthoritativeTotal > 0 ? calculatedAuthoritativeTotal : (input.totalPriceEtb ?? 0);

    const orderStoreId = primaryStoreId || input.storeId || null;

    // 2. Prepare JSON serialization for items with storeId attribution
    let serializedItems: string | null = null;
    if (resolvedItems.length > 0) {
      serializedItems = JSON.stringify(
        resolvedItems.map((it: any) => ({
          productId: it.productId || it.id || undefined,
          sku: it.sku || undefined,
          title: it.title || it.name || "Garment Item",
          storeId: it.storeId || orderStoreId,
          priceEtb: it.priceEtb ?? it.price ?? it.unitPrice ?? 0,
          quantity: Number(it.quantity) || 1,
          size: it.size ?? null,
          colorName: it.colorName ?? it.color ?? null,
          image: it.image ?? it.imageUrl ?? null,
        }))
      );
    } else if (input.garmentSku || input.garmentTitle) {
      serializedItems = JSON.stringify([
        {
          sku: input.garmentSku || "MTF-ATELIER",
          title: input.garmentTitle || "Bespoke Garment",
          storeId: orderStoreId,
          priceEtb: totalPrice,
          quantity: qty,
          size: null,
          colorName: null,
          image: null,
        },
      ]);
    }

    // 3. Prepare batch statements for atomic execution
    const batchStatements: any[] = [];

    const paymentStatus = input.paymentStatus || (input.paymentMethod === 'chapa' ? 'pending' : 'unpaid');
    const paymentTxRef = input.paymentTxRef || null;
    const paymentReference = input.paymentReference || null;
    const paymentProvider = input.paymentProvider || (input.paymentMethod === 'chapa' ? 'chapa' : null);
    const paidAt = input.paidAt || (paymentStatus === 'paid' ? now : null);
    const deliveredAt = input.deliveredAt || (input.status === 'delivered' ? now : null);
    const confirmedReceiptAt = input.confirmedReceiptAt || null;
    const deliveryFee = input.deliveryFee != null ? Number(input.deliveryFee) : 0;
    const promoCode = input.promoCode || null;
    const discountEtb = input.discountEtb != null ? Number(input.discountEtb) : 0;

    // Statement A: Insert the Order with items JSON and storeId
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO orders (id, customerName, customerEmail, customerPhone, garmentTitle, garmentSku, quantity, items, totalPriceEtb, paymentMethod, paymentStatus, paymentTxRef, paymentReference, paymentProvider, paidAt, deliveredAt, confirmedReceiptAt, deliveryFee, promoCode, discountEtb, status, shippingAddress, orderSource, storeId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
        )
        .bind(
          orderId,
          customerName,
          customerEmail,
          input.customerPhone || "N/A",
          input.garmentTitle || "Bespoke Garment",
          input.garmentSku || "MTF-ATELIER",
          qty,
          serializedItems,
          verifiedTotalPrice,
          input.paymentMethod || "Mobile Transfer",
          paymentStatus,
          paymentTxRef,
          paymentReference,
          paymentProvider,
          paidAt,
          deliveredAt,
          confirmedReceiptAt,
          deliveryFee,
          promoCode,
          discountEtb,
          input.status || "pending",
          input.shippingAddress || "Addis Ababa, Ethiopia",
          input.orderSource || "phone",
          orderStoreId,
          now,
          now
        )
    );

    // Statement B: Decrement Stock on Garments with Concurrency Guard (atomic stock check)
    if (resolvedItems.length > 0) {
      for (const item of resolvedItems) {
        const itemQty = Number(item.quantity) || 1;
        const targetId = item.productId || item.id;
        if (targetId) {
          batchStatements.push(
            this.d1
              .prepare(
                `UPDATE garments SET stockQuantity = stockQuantity - ?, updatedAt = ? WHERE id = ? AND stockQuantity >= ?;`
              )
              .bind(itemQty, now, targetId, itemQty)
          );
        } else if (item.sku) {
          batchStatements.push(
            this.d1
              .prepare(
                `UPDATE garments SET stockQuantity = stockQuantity - ?, updatedAt = ? WHERE sku = ? AND stockQuantity >= ?;`
              )
              .bind(itemQty, now, item.sku, itemQty)
          );
        }
      }
    } else if (input.garmentSku) {
      batchStatements.push(
        this.d1
          .prepare(
            `UPDATE garments SET stockQuantity = stockQuantity - ?, updatedAt = ? WHERE sku = ? AND stockQuantity >= ?;`
          )
          .bind(qty, now, input.garmentSku, qty)
      );
    }

    // Statement C: Auto-record customer spend in directory
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO customers (id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             ordersCount = ordersCount + 1,
             totalSpentEtb = totalSpentEtb + ?,
             name = excluded.name,
             updatedAt = ?;`
        )
        .bind(
          `cust-${crypto.randomUUID().slice(0, 8)}`,
          customerName,
          customerEmail,
          input.customerPhone || "N/A",
          verifiedTotalPrice,
          now,
          now,
          verifiedTotalPrice,
          now
        )
    );

    // Execute atomic batch
    await this.d1.batch(batchStatements);

    const created = await this.findById(orderId);
    if (!created) throw new Error("Failed to retrieve created order");
    return created;
  }

  async updateStatus(id: string, newStatus?: string, paymentStatus?: string): Promise<Order | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === "delivered") {
        updateData.deliveredAt = new Date().toISOString();
        // When COD order is marked delivered and paymentStatus is not explicitly specified, auto-transition to paid
        if (existing.paymentMethod === "Cash on Delivery" && !paymentStatus) {
          updateData.paymentStatus = "paid";
          updateData.paidAt = new Date().toISOString();
        }
      }
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === "paid" && !existing.paidAt) {
        updateData.paidAt = new Date().toISOString();
      }
    }

    await this.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));

    return this.findById(id);
  }

  async findByTxRef(txRef: string): Promise<Order | null> {
    const [record] = await this.db.select().from(orders).where(eq(orders.paymentTxRef, txRef));
    if (!record) return null;
    return formatOrderRecord(record);
  }

  async updatePaymentSuccess(
    id: string,
    paymentReference?: string,
    paymentProvider?: string,
    paidAt?: string
  ): Promise<Order | null> {
    const timestamp = paidAt || new Date().toISOString();
    const updateData: any = {
      paymentStatus: "paid",
      status: "processing",
      paidAt: timestamp,
      updatedAt: new Date().toISOString(),
    };
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    if (paymentProvider) {
      updateData.paymentProvider = paymentProvider;
    }
    await this.db.update(orders).set(updateData).where(eq(orders.id, id));
    return this.findById(id);
  }

  async confirmReceipt(id: string): Promise<Order | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateData: any = {
      status: "delivered",
      deliveredAt: existing.deliveredAt || now,
      confirmedReceiptAt: now,
      updatedAt: now,
    };

    if (existing.paymentMethod === "Cash on Delivery" && existing.paymentStatus !== "paid") {
      updateData.paymentStatus = "paid";
      updateData.paidAt = now;
    }

    await this.db.update(orders).set(updateData).where(eq(orders.id, id));
    return this.findById(id);
  }

  async updatePaymentFailed(id: string): Promise<Order | null> {
    await this.db
      .update(orders)
      .set({
        paymentStatus: "failed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, id));
    return this.findById(id);
  }
}
