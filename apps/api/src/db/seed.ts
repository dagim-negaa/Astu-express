import type { D1Database } from "@cloudflare/workers-types";
import { createAuth } from "../lib/auth";

export async function ensureD1TablesAndSeedAdmin(d1: D1Database, secret?: string) {
  try {
    await d1.batch([
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          emailVerified INTEGER NOT NULL DEFAULT 0,
          image TEXT,
          role TEXT NOT NULL DEFAULT "user",
          banned INTEGER NOT NULL DEFAULT 0,
          banReason TEXT,
          banExpires INTEGER,
          status TEXT NOT NULL DEFAULT "Active",
          phone TEXT,
          department TEXT DEFAULT "staff",
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS session (
          id TEXT PRIMARY KEY,
          expiresAt INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          impersonatedBy TEXT
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS account (
          id TEXT PRIMARY KEY,
          accountId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          accessToken TEXT,
          refreshToken TEXT,
          idToken TEXT,
          accessTokenExpiresAt INTEGER,
          refreshTokenExpiresAt INTEGER,
          scope TEXT,
          password TEXT,
          issuer TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS verification (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt INTEGER NOT NULL,
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS garments (
          id TEXT PRIMARY KEY,
          sku TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          storeId TEXT,
          priceEtb REAL NOT NULL,
          buyingPriceEtb REAL,
          profitMargin REAL,
          stockQuantity INTEGER NOT NULL DEFAULT 0,
          initialStock INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT "draft",
          color TEXT NOT NULL DEFAULT "Standard",
          size TEXT NOT NULL DEFAULT "Standard",
          colors TEXT,
          sizes TEXT,
          materials TEXT,
          images TEXT,
          description TEXT,
          is_featured INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customerName TEXT NOT NULL,
          customerEmail TEXT NOT NULL,
          customerPhone TEXT,
          garmentTitle TEXT NOT NULL,
          garmentSku TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          items TEXT,
          totalPriceEtb REAL NOT NULL,
          paymentMethod TEXT NOT NULL DEFAULT "Mobile Transfer",
          paymentStatus TEXT NOT NULL DEFAULT "unpaid",
          paymentTxRef TEXT,
          paymentReference TEXT,
          paymentProvider TEXT DEFAULT "chapa",
          paidAt TEXT,
          deliveredAt TEXT,
          confirmedReceiptAt TEXT,
          deliveryFee REAL NOT NULL DEFAULT 0,
          promoCode TEXT,
          discountEtb REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT "pending",
          shippingAddress TEXT NOT NULL DEFAULT "Addis Ababa, Ethiopia",
          orderSource TEXT NOT NULL DEFAULT "phone",
          storeId TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL DEFAULT "N/A",
          ordersCount INTEGER NOT NULL DEFAULT 0,
          totalSpentEtb REAL NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          isDefault INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      // NEW ERP TABLES
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          country TEXT DEFAULT 'Ethiopia',
          taxId TEXT,
          paymentTerms TEXT DEFAULT 'Net 30',
          status TEXT DEFAULT 'active',
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id TEXT PRIMARY KEY,
          supplierId TEXT NOT NULL REFERENCES suppliers(id),
          status TEXT DEFAULT 'draft',
          totalAmountEtb REAL NOT NULL DEFAULT 0,
          taxAmountEtb REAL DEFAULT 0,
          shippingCostEtb REAL DEFAULT 0,
          notes TEXT,
          expectedDeliveryDate TEXT,
          receivedAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id TEXT PRIMARY KEY,
          purchaseOrderId TEXT NOT NULL REFERENCES purchase_orders(id),
          garmentId TEXT REFERENCES garments(id),
          description TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unitCostEtb REAL NOT NULL,
          totalCostEtb REAL NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          amountEtb REAL NOT NULL,
          date TEXT NOT NULL,
          paymentMethod TEXT DEFAULT 'cash',
          reference TEXT,
          createdAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS shipments (
          id TEXT PRIMARY KEY,
          orderId TEXT NOT NULL REFERENCES orders(id),
          carrier TEXT NOT NULL,
          trackingNumber TEXT,
          status TEXT DEFAULT 'pending',
          shippingAddress TEXT NOT NULL,
          shippingCostEtb REAL DEFAULT 0,
          estimatedDelivery TEXT,
          actualDelivery TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
    ]);

    // Safe column additions for legacy migrations
    const alterColumns = [
      "ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user';",
      "ALTER TABLE user ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;",
      "ALTER TABLE user ADD COLUMN banReason TEXT;",
      "ALTER TABLE user ADD COLUMN banExpires INTEGER;",
      "ALTER TABLE user ADD COLUMN status TEXT NOT NULL DEFAULT 'Active';",
      "ALTER TABLE user ADD COLUMN phone TEXT;",
      "ALTER TABLE user ADD COLUMN department TEXT DEFAULT 'staff';",
      "ALTER TABLE session ADD COLUMN impersonatedBy TEXT;",
      "ALTER TABLE account ADD COLUMN issuer TEXT;",
      "ALTER TABLE garments ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;",
      "ALTER TABLE garments ADD COLUMN initialStock INTEGER NOT NULL DEFAULT 0;",
      "ALTER TABLE garments ADD COLUMN storeId TEXT;",
      "ALTER TABLE garments ADD COLUMN buyingPriceEtb REAL;",
      "ALTER TABLE garments ADD COLUMN profitMargin REAL;",
      "ALTER TABLE garments ADD COLUMN colors TEXT;",
      "ALTER TABLE garments ADD COLUMN sizes TEXT;",
      "ALTER TABLE garments ADD COLUMN materials TEXT;",
      "ALTER TABLE garments ADD COLUMN images TEXT;",
      "ALTER TABLE orders ADD COLUMN items TEXT;",
      "ALTER TABLE orders ADD COLUMN storeId TEXT;",
      "ALTER TABLE orders ADD COLUMN paymentStatus TEXT NOT NULL DEFAULT 'unpaid';",
      "ALTER TABLE orders ADD COLUMN paymentTxRef TEXT;",
      "ALTER TABLE orders ADD COLUMN paymentReference TEXT;",
      "ALTER TABLE orders ADD COLUMN paymentProvider TEXT DEFAULT 'chapa';",
      "ALTER TABLE orders ADD COLUMN paidAt TEXT;",
      "ALTER TABLE orders ADD COLUMN deliveredAt TEXT;",
      "ALTER TABLE orders ADD COLUMN confirmedReceiptAt TEXT;",
      "ALTER TABLE orders ADD COLUMN deliveryFee REAL NOT NULL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN promoCode TEXT;",
      "ALTER TABLE orders ADD COLUMN discountEtb REAL NOT NULL DEFAULT 0;",
    ];

    for (const sql of alterColumns) {
      try {
        await d1.prepare(sql).run();
      } catch {
        // Column already exists
      }
    }

    // Allocate existing historical garments and orders without storeId to ASTU Express Main Hub
    try {
      await d1.prepare("UPDATE garments SET storeId = 'store-1' WHERE storeId IS NULL OR storeId = '';").run();
      await d1.prepare("UPDATE orders SET storeId = 'store-1' WHERE storeId IS NULL OR storeId = '';").run();
    } catch (e) {
      console.warn("Store allocation warning:", e);
    }

    // Seed official internal staff accounts for all 4 roles
    const seedStaff = [
      { name: "Master Owner", email: "owner@r2express.com", password: "admin1234", role: "owner", department: "owner" },
      { name: "System Admin", email: "admin@admin.com", password: "admin1234", role: "admin", department: "operations" },
      { name: "Logistics Manager", email: "manager@r2express.com", password: "manager1234", role: "manager", department: "operations" },
      { name: "Order Operator", email: "operator@r2express.com", password: "operator1234", role: "operator", department: "sales" },
    ];

    for (const staff of seedStaff) {
      try {
        const existing: any = await d1
          .prepare("SELECT id FROM user WHERE email = ? LIMIT 1")
          .bind(staff.email)
          .first();

        if (!existing) {
          const auth = createAuth(d1, secret);
          await auth.api.signUpEmail({
            body: {
              name: staff.name,
              email: staff.email,
              password: staff.password,
            },
          });
          await d1
            .prepare("UPDATE user SET role = ?, emailVerified = 1, status = 'Active', banned = 0, department = ? WHERE email = ?")
            .bind(staff.role, staff.department, staff.email)
            .run();
        }
      } catch (e) {
        console.warn(`Staff seeding error for ${staff.email}:`, e);
      }
    }

    // Default Store Hub - ASTU Express Main Hub
    await d1
      .prepare(
        `INSERT INTO stores (id, name, location, isDefault, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, ?, ?)
         ON CONFLICT (id) DO NOTHING;`
      )
      .bind("store-1", "R2 Express Central Hub", "Addis Ababa & Adama, Ethiopia", new Date().toISOString(), new Date().toISOString())
      .run();
  } catch (e) {
    console.warn("ensureD1TablesAndSeedAdmin warning:", e);
  }
}

export async function resetDatabase(d1: D1Database, secret?: string) {
  try {
    await d1.batch([
      d1.prepare("DELETE FROM shipment_items;"),
      d1.prepare("DELETE FROM shipments;"),
      d1.prepare("DELETE FROM purchase_order_items;"),
      d1.prepare("DELETE FROM purchase_orders;"),
      d1.prepare("DELETE FROM expenses;"),
      d1.prepare("DELETE FROM suppliers;"),
      d1.prepare("DELETE FROM orders;"),
      d1.prepare("DELETE FROM garments;"),
      d1.prepare("DELETE FROM customers;"),
      d1.prepare("DELETE FROM stores;"),
      d1.prepare("DELETE FROM session;"),
      d1.prepare("DELETE FROM account;"),
      d1.prepare("DELETE FROM verification;"),
      d1.prepare("DELETE FROM user;"),
    ]);
  } catch (e) {
    console.warn("Table purge warning:", e);
  }
  await ensureD1TablesAndSeedAdmin(d1, secret);
}
