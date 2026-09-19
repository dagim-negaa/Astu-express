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
    trackingNumber: o.trackingNumber ?? undefined,
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
    accountId: o.accountId ?? undefined,
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
    if (filter?.trackingNumber) {
      conditions.push(eq(sql`lower(${orders.trackingNumber})`, filter.trackingNumber.trim().toLowerCase()));
    }
    const searchParam = filter?.query || filter?.q;
    if (searchParam) {
      const q = `%${searchParam.trim().toLowerCase()}%`;
      conditions.push(sql`(lower(${orders.trackingNumber}) LIKE ${q} OR lower(${orders.id}) LIKE ${q} OR lower(${orders.customerName}) LIKE ${q} OR lower(${orders.customerEmail}) LIKE ${q})`);
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

  async findByTrackingNumber(trackingNumber: string): Promise<Order | null> {
    const clean = trackingNumber.trim().toLowerCase();
    const [record] = await this.db
      .select()
      .from(orders)
      .where(eq(sql`lower(${orders.trackingNumber})`, clean));
    if (!record) return null;
    return formatOrderRecord(record);
  }

  async trackOrder(query: string): Promise<any | null> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    // Search by orders.trackingNumber, orders.id, or shipments.trackingNumber
    let orderRow = await this.d1
      .prepare(
        `SELECT o.*, s.carrier as shipmentCarrier, s.trackingNumber as shipmentTracking, s.status as shipmentStatus, s.estimatedDelivery as shipmentEstimatedDelivery, s.actualDelivery as shipmentActualDelivery, s.notes as shipmentNotes
         FROM orders o
         LEFT JOIN shipments s ON s.orderId = o.id
         WHERE lower(o.trackingNumber) = lower(?)
            OR lower(o.id) = lower(?)
            OR lower(s.trackingNumber) = lower(?)
         LIMIT 1;`
      )
      .bind(cleanQuery, cleanQuery, cleanQuery)
      .first<any>();

    if (!orderRow && cleanQuery.length >= 5) {
      orderRow = await this.d1
        .prepare(
          `SELECT o.*, s.carrier as shipmentCarrier, s.trackingNumber as shipmentTracking, s.status as shipmentStatus, s.estimatedDelivery as shipmentEstimatedDelivery, s.actualDelivery as shipmentActualDelivery, s.notes as shipmentNotes
           FROM orders o
           LEFT JOIN shipments s ON s.orderId = o.id
           WHERE o.trackingNumber LIKE ?
              OR o.id LIKE ?
              OR s.trackingNumber LIKE ?
           LIMIT 1;`
        )
        .bind(`%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`)
        .first<any>();
    }

    if (!orderRow) return null;

    const formatted = formatOrderRecord(orderRow);
    const trackingNumber = orderRow.trackingNumber || orderRow.shipmentTracking || `ETH-TRK-${orderRow.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;

    // Timeline calculation based on status
    const status = (orderRow.status || "pending").toLowerCase();
    const isProcessing = ["processing", "shipped", "delivered"].includes(status);
    const isShipped = ["shipped", "delivered"].includes(status);
    const isDelivered = status === "delivered";

    const timeline = [
      {
        status: "confirmed",
        title: "Order Placed & Registered",
        description: `Order registered in Astu-Express system for ${orderRow.customerName || "Customer"}`,
        timestamp: orderRow.createdAt,
        completed: true,
        current: status === "pending",
      },
      {
        status: "processing",
        title: "Hub Processing & Quality Inspection",
        description: "Garment hand-tailored, inspected for fabric quality, and boxed at Addis Ababa Atelier",
        timestamp: isProcessing ? (orderRow.updatedAt || orderRow.createdAt) : null,
        completed: isProcessing,
        current: status === "processing",
      },
      {
        status: "shipped",
        title: "Dispatched with Carrier",
        description: `Package assigned to ${orderRow.shipmentCarrier || "Ethiopian Postal Service (EMS)"} under tracking ID ${trackingNumber}`,
        timestamp: isShipped ? orderRow.updatedAt : null,
        completed: isShipped,
        current: status === "shipped",
      },
      {
        status: "delivered",
        title: "Delivered to Destination",
        description: `Delivered safely to ${orderRow.shippingAddress || "customer address"}`,
        timestamp: orderRow.deliveredAt || (isDelivered ? orderRow.updatedAt : null),
        completed: isDelivered,
        current: isDelivered,
      },
    ];

    return {
      id: orderRow.id,
      trackingNumber,
      status: orderRow.status || "pending",
      createdAt: orderRow.createdAt,
      updatedAt: orderRow.updatedAt,
      deliveredAt: orderRow.deliveredAt,
      confirmedReceiptAt: orderRow.confirmedReceiptAt,
      customerName: orderRow.customerName,
      customerEmail: orderRow.customerEmail,
      shippingAddress: orderRow.shippingAddress,
      carrier: orderRow.shipmentCarrier || "Ethiopian Postal Service (EMS)",
      estimatedDelivery: orderRow.shipmentEstimatedDelivery || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      garmentTitle: orderRow.garmentTitle,
      items: formatted.items || [],
      quantity: orderRow.quantity || 1,
      totalPriceEtb: orderRow.totalPriceEtb || 0,
      deliveryFee: orderRow.deliveryFee || 0,
      paymentMethod: orderRow.paymentMethod || "Mobile Transfer",
      paymentStatus: orderRow.paymentStatus || "unpaid",
      notes: orderRow.shipmentNotes,
      timeline,
    };
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

    const trackingNumber = (input.trackingNumber || "").trim() ||
      `ETH-TRK-${Math.floor(100000 + Math.random() * 900000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    // Statement A: Insert the Order with items JSON, trackingNumber, accountId, and storeId
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO orders (id, customerName, customerEmail, customerPhone, garmentTitle, garmentSku, quantity, items, totalPriceEtb, paymentMethod, paymentStatus, paymentTxRef, paymentReference, paymentProvider, accountId, paidAt, deliveredAt, confirmedReceiptAt, deliveryFee, promoCode, discountEtb, status, trackingNumber, shippingAddress, orderSource, storeId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
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
          input.accountId || null,
          paidAt,
          deliveredAt,
          confirmedReceiptAt,
          deliveryFee,
          promoCode,
          discountEtb,
          input.status || "pending",
          trackingNumber,
          input.shippingAddress || "Addis Ababa, Ethiopia",
          input.orderSource || "phone",
          orderStoreId,
          now,
          now
        )
    );

    // Statement A2: Automatically create linked shipment record
    const shipmentId = `ship-${crypto.randomUUID().slice(0, 8)}`;
    const estDelivery = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO shipments (id, orderId, carrier, trackingNumber, status, shippingAddress, shippingCostEtb, estimatedDelivery, notes, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO NOTHING;`
        )
        .bind(
          shipmentId,
          orderId,
          "Ethiopian Postal Service (EMS)",
          trackingNumber,
          input.status || "pending",
          input.shippingAddress || "Addis Ababa, Ethiopia",
          deliveryFee,
          estDelivery,
          "Central Addis Ababa Distribution Depot",
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

    if (paymentStatus.toLowerCase() === 'paid') {
      await this.creditOrderRevenue(orderId, input.accountId || undefined);
    }

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

    if (updateData.paymentStatus?.toLowerCase() === 'paid') {
      await this.creditOrderRevenue(id);
    }

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
    await this.creditOrderRevenue(id);
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
    if (updateData.paymentStatus?.toLowerCase() === 'paid') {
      await this.creditOrderRevenue(id);
    }
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

  private async creditOrderRevenue(orderId: string, targetAccountId?: string): Promise<void> {
    try {
      const order = await this.findById(orderId);
      if (!order || (order.paymentStatus || "").toLowerCase() !== "paid" || (order.totalPriceEtb ?? 0) <= 0) {
        return;
      }

      // Check if already credited in financial_transactions
      const existingTxn = await this.d1
        .prepare("SELECT id FROM financial_transactions WHERE referenceId = ? AND type = 'sale_income' LIMIT 1")
        .bind(orderId)
        .first();
      if (existingTxn) return;

      // Determine target account
      let accountId = targetAccountId || (order as any).accountId;
      if (!accountId) {
        const method = (order.paymentMethod || "").toLowerCase();
        if (method.includes("telebirr")) {
          accountId = "acc-telebirr-1";
        } else if (method.includes("cash")) {
          accountId = "acc-cash-1";
        } else if (method.includes("awash")) {
          accountId = "acc-awash-1";
        } else {
          const defAccount: any = await this.d1
            .prepare("SELECT id FROM bank_accounts WHERE isDefault = 1 LIMIT 1")
            .first();
          accountId = defAccount?.id || "acc-cbe-1";
        }
      }

      // Check if account exists
      let account: any = await this.d1
        .prepare("SELECT id, currentBalance FROM bank_accounts WHERE id = ? LIMIT 1")
        .bind(accountId)
        .first();

      if (!account) {
        account = await this.d1
          .prepare("SELECT id, currentBalance FROM bank_accounts LIMIT 1")
          .first();
      }

      if (!account) return;

      const orderAmount = Number(order.totalPriceEtb) || 0;
      const newBalance = Math.round((Number(account.currentBalance || 0) + orderAmount) * 100) / 100;
      const now = new Date().toISOString();
      const today = now.split("T")[0];
      const txnId = `txn-sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      await this.d1.batch([
        this.d1
          .prepare("UPDATE bank_accounts SET currentBalance = ?, updatedAt = ? WHERE id = ?")
          .bind(newBalance, now, account.id),
        this.d1
          .prepare(
            `INSERT INTO financial_transactions (id, accountId, type, amountEtb, balanceAfter, description, category, referenceId, date, createdAt)
             VALUES (?, ?, 'sale_income', ?, ?, ?, 'sales', ?, ?, ?)`
          )
          .bind(
            txnId,
            account.id,
            orderAmount,
            newBalance,
            `Customer Sale Payment - #${order.id.slice(-6).toUpperCase()} (${order.customerName})`,
            order.id,
            today,
            now
          ),
        this.d1
          .prepare("UPDATE orders SET accountId = ? WHERE id = ?")
          .bind(account.id, order.id),
      ]);
    } catch (e) {
      console.warn(`Failed to credit order revenue for order ${orderId}:`, e);
    }
  }
}
