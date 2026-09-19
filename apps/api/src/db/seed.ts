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
          trackingNumber TEXT,
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
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id TEXT PRIMARY KEY,
          accountName TEXT NOT NULL,
          bankName TEXT NOT NULL,
          accountNumber TEXT NOT NULL,
          accountType TEXT DEFAULT 'bank' NOT NULL,
          initialBalance REAL DEFAULT 0 NOT NULL,
          currentBalance REAL DEFAULT 0 NOT NULL,
          currency TEXT DEFAULT 'ETB' NOT NULL,
          isDefault INTEGER DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'active' NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          location TEXT NOT NULL,
          isDefault INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS warehouse_items (
          id TEXT PRIMARY KEY,
          warehouseId TEXT NOT NULL REFERENCES warehouses(id),
          purchaseOrderId TEXT REFERENCES purchase_orders(id),
          supplierId TEXT REFERENCES suppliers(id),
          supplierName TEXT,
          grnNumber TEXT,
          itemTitle TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'rtw',
          quantity INTEGER NOT NULL DEFAULT 0,
          receivedQuantity INTEGER NOT NULL DEFAULT 0,
          transferredQuantity INTEGER NOT NULL DEFAULT 0,
          unitCostEtb REAL NOT NULL DEFAULT 0,
          totalCostEtb REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'in_warehouse',
          receivedAt TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS financial_transactions (
          id TEXT PRIMARY KEY,
          accountId TEXT NOT NULL REFERENCES bank_accounts(id),
          type TEXT NOT NULL,
          amountEtb REAL NOT NULL,
          balanceAfter REAL NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          referenceId TEXT,
          date TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `),
      d1.prepare(`
        CREATE TABLE IF NOT EXISTS storage_objects (
          key TEXT PRIMARY KEY,
          data BLOB NOT NULL,
          contentType TEXT NOT NULL DEFAULT 'image/webp',
          size INTEGER NOT NULL DEFAULT 0,
          etag TEXT NOT NULL,
          uploadedAt INTEGER NOT NULL
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
      "ALTER TABLE orders ADD COLUMN accountId TEXT REFERENCES bank_accounts(id);",
      "ALTER TABLE orders ADD COLUMN paidAt TEXT;",
      "ALTER TABLE orders ADD COLUMN deliveredAt TEXT;",
      "ALTER TABLE orders ADD COLUMN confirmedReceiptAt TEXT;",
      "ALTER TABLE orders ADD COLUMN deliveryFee REAL NOT NULL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN promoCode TEXT;",
      "ALTER TABLE orders ADD COLUMN discountEtb REAL NOT NULL DEFAULT 0;",
      "ALTER TABLE expenses ADD COLUMN accountId TEXT REFERENCES bank_accounts(id);",
      "ALTER TABLE purchase_orders ADD COLUMN paymentStatus TEXT DEFAULT 'unpaid';",
      "ALTER TABLE purchase_orders ADD COLUMN accountId TEXT REFERENCES bank_accounts(id);",
      "ALTER TABLE purchase_orders ADD COLUMN warehouseId TEXT REFERENCES warehouses(id);",
      "ALTER TABLE purchase_orders ADD COLUMN grnNumber TEXT;",
      "ALTER TABLE purchase_orders ADD COLUMN paidAt TEXT;",
      "ALTER TABLE purchase_order_items ADD COLUMN category TEXT DEFAULT 'rtw';",
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
      .bind("store-1", "ASTU Express Central Hub", "Addis Ababa & Adama, Ethiopia", new Date().toISOString(), new Date().toISOString())
      .run();

    // Default Warehouses (Central Garment Warehouses & Regional Distribution Centers)
    const defaultWarehouses = [
      { id: "wh-main", name: "Central Garment Warehouse (Addis Ababa)", code: "WH-AA-01", location: "Bole Industrial Zone, Addis Ababa", def: 1 },
      { id: "wh-adama", name: "Adama Regional Depot", code: "WH-AD-01", location: "Adama Logistics Terminal, Adama", def: 0 },
      { id: "wh-hawassa", name: "Hawassa Garment Storage Hub", code: "WH-HW-01", location: "Hawassa Industrial Park, Hawassa", def: 0 },
    ];

    for (const wh of defaultWarehouses) {
      try {
        await d1
          .prepare(
            `INSERT INTO warehouses (id, name, code, location, isDefault, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
             ON CONFLICT (id) DO NOTHING;`
          )
          .bind(wh.id, wh.name, wh.code, wh.location, wh.def, new Date().toISOString(), new Date().toISOString())
          .run();
      } catch (e) {
        console.warn(`Warehouse seeding error for ${wh.id}:`, e);
      }
    }

    // Default Ethiopian Bank Accounts — Initial balances set to 0 ETB (Owner deposits funds manually)
    const defaultAccounts = [
      { id: "acc-cbe-1", name: "CBE Main Operating Account", bank: "Commercial Bank of Ethiopia", num: "1000284918231", type: "bank", init: 0, def: 1 },
      { id: "acc-awash-1", name: "Awash Bank Logistics Account", bank: "Awash Bank", num: "01425893211000", type: "bank", init: 0, def: 0 },
      { id: "acc-telebirr-1", name: "Telebirr Merchant Gateway", bank: "Telebirr", num: "0911223344", type: "telebirr", init: 0, def: 0 },
      { id: "acc-cash-1", name: "Petty Cash & Vault", bank: "Cash on Hand", num: "PETTY-01", type: "cash", init: 0, def: 0 },
    ];

    for (const acc of defaultAccounts) {
      try {
        await d1
          .prepare(
            `INSERT INTO bank_accounts (id, accountName, bankName, accountNumber, accountType, initialBalance, currentBalance, currency, isDefault, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'ETB', ?, 'active', ?, ?)
             ON CONFLICT (id) DO NOTHING;`
          )
          .bind(acc.id, acc.name, acc.bank, acc.num, acc.type, acc.init, acc.init, acc.def, new Date().toISOString(), new Date().toISOString())
          .run();
      } catch (e) {
        console.warn(`Bank account seeding warning for ${acc.id}:`, e);
      }
    }

    // Seed Real Garment Catalog and Storage Images
    await seedRealGarmentsAndStorageImages(d1);
  } catch (e) {
    console.warn("ensureD1TablesAndSeedAdmin warning:", e);
  }
}

export async function seedRealGarmentsAndStorageImages(d1: D1Database) {
  try {
    // 1. Seed Real Images into Storage Engine (storage_objects table)
    const realImagesToStore = [
      {
        key: "products/kemis-trad-01/preview.webp",
        url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Habesha Kemis Traditional Dress",
      },
      {
        key: "products/kemis-trad-01/thumb.webp",
        url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80",
        contentType: "image/jpeg",
        label: "Habesha Kemis Thumbnail",
      },
      {
        key: "products/kidan-men-01/preview.webp",
        url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Men's Shemma Ceremonial Tunic",
      },
      {
        key: "products/shemma-jacket-01/preview.webp",
        url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Modern Ethiopian Bomber Jacket",
      },
      {
        key: "products/netela-scarf-01/preview.webp",
        url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Handwoven Cotton Netela",
      },
      {
        key: "products/leather-oxford-01/preview.webp",
        url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Highland Leather Oxford Shoes",
      },
      {
        key: "products/habesha-evening-01/preview.webp",
        url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
        contentType: "image/jpeg",
        label: "Modern Silhouette Evening Gown",
      },
    ];

    for (const img of realImagesToStore) {
      try {
        const existing = await d1
          .prepare("SELECT key FROM storage_objects WHERE key = ? LIMIT 1")
          .bind(img.key)
          .first();

        if (!existing) {
          let buffer: Uint8Array | null = null;
          let mime = img.contentType;

          try {
            const res = await fetch(img.url, {
              headers: {
                "User-Agent": "AstuGarment-StorageSeeder/1.0",
                Accept: "image/*,*/*",
              },
            });
            if (res.ok) {
              const ab = await res.arrayBuffer();
              buffer = new Uint8Array(ab);
              mime = res.headers.get("content-type") || img.contentType;
            }
          } catch (fetchErr) {
            console.warn(`Could not fetch online asset for ${img.key}, generating fallback SVG:`, fetchErr);
          }

          // Fallback SVG graphic with Ethiopian Tibeb motif if network fetch is unavailable
          if (!buffer) {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0284c7" />
                  <stop offset="50%" stop-color="#0369a1" />
                  <stop offset="100%" stop-color="#8b3224" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#g)" />
              <rect x="40" y="40" width="720" height="720" fill="none" stroke="#fef08a" stroke-width="4" stroke-dasharray="16,8" />
              <circle cx="400" cy="360" r="140" fill="#ffffff" opacity="0.15" />
              <text x="400" y="380" fill="#ffffff" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">ASTU EXPRESS ETHIOPIA</text>
              <text x="400" y="430" fill="#fef08a" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">${img.label}</text>
              <text x="400" y="470" fill="#e2e8f0" font-family="-apple-system, system-ui, sans-serif" font-size="14" text-anchor="middle">Storage Proxy Verified Asset</text>
            </svg>`;
            buffer = new TextEncoder().encode(svgContent);
            mime = "image/svg+xml";
          }

          const etag = `"seed-${img.key.replace(/[^a-zA-Z0-9]/g, "-")}-${buffer.byteLength}"`;

          await d1
            .prepare(
              `INSERT INTO storage_objects (key, data, contentType, size, etag, uploadedAt)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT (key) DO UPDATE SET
                 data = excluded.data,
                 contentType = excluded.contentType,
                 size = excluded.size,
                 etag = excluded.etag,
                 uploadedAt = excluded.uploadedAt;`
            )
            .bind(img.key, buffer, mime, buffer.byteLength, etag, Date.now())
            .run();
        }
      } catch (e) {
        console.warn(`Storage object seed error for ${img.key}:`, e);
      }
    }

    // 2. Do not auto-seed garments (all storefront products strictly originate from warehouse inventory / GRN)
    const shouldSeedDemoGarments = false;
    if (shouldSeedDemoGarments) {
      const seedGarments = [
        {
          id: "garm-kemis-01",
          sku: "ETH-KEMIS-001",
          title: "Traditional Habesha Kemis (Royal Gold Tilet)",
          category: "traditional",
          storeId: "store-1",
          priceEtb: 4800,
          buyingPriceEtb: 2800,
          profitMargin: 2000,
          stockQuantity: 18,
          initialStock: 25,
          status: "completed",
          color: "Ivory White",
          size: "M",
          colors: JSON.stringify([
            { name: "Ivory White", hex: "#faf9f6", images: { front: "/api/assets/products/kemis-trad-01/preview.webp" } },
            { name: "Gold Accent", hex: "#d4af37", images: { front: "/api/assets/products/kemis-trad-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "S", available: true },
            { label: "M", available: true },
            { label: "L", available: true },
            { label: "XL", available: true },
          ]),
          materials: JSON.stringify(["Handspun Ethiopian Cotton", "Gold Silk Tilet Embroidery"]),
          images: JSON.stringify([
            "/api/assets/products/kemis-trad-01/preview.webp",
            "/api/assets/products/kemis-trad-01/thumb.webp",
          ]),
          description: "Mastercrafted traditional Ethiopian Habesha Kemis tailored from 100% organic Shemma cotton with hand-embroidered royal gold Tilet trimming. Ideal for weddings, Enkutatash, and formal cultural ceremonies.",
          isFeatured: 1,
        },
        {
          id: "garm-kidan-02",
          sku: "ETH-KIDAN-002",
          title: "Men's Handwoven Shemma Tunic & Trousers",
          category: "traditional",
          storeId: "store-1",
          priceEtb: 3600,
          buyingPriceEtb: 2100,
          profitMargin: 1500,
          stockQuantity: 14,
          initialStock: 20,
          status: "completed",
          color: "Pure White",
          size: "L",
          colors: JSON.stringify([
            { name: "Pure White", hex: "#ffffff", images: { front: "/api/assets/products/kidan-men-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "M", available: true },
            { label: "L", available: true },
            { label: "XL", available: true },
          ]),
          materials: JSON.stringify(["100% Handwoven Shemma Cotton", "Tibeb Neck Embroidery"]),
          images: JSON.stringify([
            "/api/assets/products/kidan-men-01/preview.webp",
          ]),
          description: "Classic Ethiopian gentleman's ceremonial tunic with intricately embroidered neckline and matching tailored trousers.",
          isFeatured: 1,
        },
        {
          id: "garm-jacket-03",
          sku: "ETH-JACKET-003",
          title: "Modern Ethiopian Shemma Bomber Jacket",
          category: "outerwear",
          storeId: "store-1",
          priceEtb: 5400,
          buyingPriceEtb: 3200,
          profitMargin: 2200,
          stockQuantity: 22,
          initialStock: 30,
          status: "completed",
          color: "Oatmeal Beige",
          size: "L",
          colors: JSON.stringify([
            { name: "Oatmeal Beige", hex: "#d8c4b6", images: { front: "/api/assets/products/shemma-jacket-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "S", available: true },
            { label: "M", available: true },
            { label: "L", available: true },
          ]),
          materials: JSON.stringify(["Heavyweight Ethiopian Cotton", "Brass Hardware", "Silk Lining"]),
          images: JSON.stringify([
            "/api/assets/products/shemma-jacket-01/preview.webp",
          ]),
          description: "Contemporary urban outerwear handcrafted by artisans in Addis Ababa. Combines authentic textured Shemma weave with modern streetwear silhouette.",
          isFeatured: 1,
        },
        {
          id: "garm-netela-04",
          sku: "ETH-NETELA-004",
          title: "Fine Handspun Cotton Netela Scarf",
          category: "accessories",
          storeId: "store-1",
          priceEtb: 1800,
          buyingPriceEtb: 950,
          profitMargin: 850,
          stockQuantity: 35,
          initialStock: 50,
          status: "completed",
          color: "White / Multicolored Border",
          size: "Standard",
          colors: JSON.stringify([
            { name: "White / Multi", hex: "#f5f5f5", images: { front: "/api/assets/products/netela-scarf-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "Standard (2.2m x 1.1m)", available: true },
          ]),
          materials: JSON.stringify(["Featherlight Ethiopian Ginned Cotton", "Tibeb Fringe"]),
          images: JSON.stringify([
            "/api/assets/products/netela-scarf-01/preview.webp",
          ]),
          description: "Delicate double-layered cotton Netela with geometric Ethiopian border accents. Soft, breathable, and gracefully draped.",
          isFeatured: 0,
        },
        {
          id: "garm-shoes-05",
          sku: "ETH-SHOES-005",
          title: "Highland Handcrafted Leather Oxford Shoes",
          category: "footwear",
          storeId: "store-1",
          priceEtb: 4200,
          buyingPriceEtb: 2600,
          profitMargin: 1600,
          stockQuantity: 12,
          initialStock: 15,
          status: "completed",
          color: "Cognac Brown",
          size: "42",
          colors: JSON.stringify([
            { name: "Cognac Brown", hex: "#7a3e1d", images: { front: "/api/assets/products/leather-oxford-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "40", available: true },
            { label: "41", available: true },
            { label: "42", available: true },
            { label: "43", available: true },
            { label: "44", available: true },
          ]),
          materials: JSON.stringify(["100% Ethiopian Calfskin Leather", "Goodyear Welt Rubber Sole"]),
          images: JSON.stringify([
            "/api/assets/products/leather-oxford-01/preview.webp",
          ]),
          description: "Artisan-cobbled formal Oxford shoes produced in Merkato's heritage leather district using premium Ethiopian Highland leather.",
          isFeatured: 0,
        },
        {
          id: "garm-dress-06",
          sku: "ETH-RTW-006",
          title: "Modern Addis Silhouette Evening Dress",
          category: "rtw",
          storeId: "store-1",
          priceEtb: 6200,
          buyingPriceEtb: 3800,
          profitMargin: 2400,
          stockQuantity: 10,
          initialStock: 15,
          status: "completed",
          color: "Emerald Green",
          size: "S",
          colors: JSON.stringify([
            { name: "Emerald Green", hex: "#0b6623", images: { front: "/api/assets/products/habesha-evening-01/preview.webp" } },
          ]),
          sizes: JSON.stringify([
            { label: "XS", available: true },
            { label: "S", available: true },
            { label: "M", available: true },
            { label: "L", available: true },
          ]),
          materials: JSON.stringify(["Ethiopian Organic Cotton Crepe", "Tibeb Gold Threading"]),
          images: JSON.stringify([
            "/api/assets/products/habesha-evening-01/preview.webp",
          ]),
          description: "Stunning fusion ready-to-wear evening gown capturing contemporary African couture aesthetics with heritage Ethiopian embroidery.",
          isFeatured: 1,
        },
      ];

      for (const g of seedGarments) {
        try {
          await d1
            .prepare(
              `INSERT INTO garments (id, sku, title, category, storeId, priceEtb, buyingPriceEtb, profitMargin, stockQuantity, initialStock, status, color, size, colors, sizes, materials, images, description, is_featured, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (id) DO NOTHING;`
            )
            .bind(
              g.id,
              g.sku,
              g.title,
              g.category,
              g.storeId,
              g.priceEtb,
              g.buyingPriceEtb,
              g.profitMargin,
              g.stockQuantity,
              g.initialStock,
              g.status,
              g.color,
              g.size,
              g.colors,
              g.sizes,
              g.materials,
              g.images,
              g.description,
              g.isFeatured,
              new Date().toISOString(),
              new Date().toISOString()
            )
            .run();
        } catch (err) {
          console.warn(`Garment insert warning for ${g.sku}:`, err);
        }
      }
    }
  } catch (err) {
    console.warn("seedRealGarmentsAndStorageImages warning:", err);
  }
}

export async function resetDatabase(d1: D1Database, secret?: string) {
  try {
    await d1.batch([
      d1.prepare("DELETE FROM storage_objects;"),
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
