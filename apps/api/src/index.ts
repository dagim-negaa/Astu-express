import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { createAuth } from "./lib/auth";
import { catalogRouter } from "./routes/catalog.routes";
import { ordersRouter } from "./routes/orders.routes";
import { identityRouter } from "./routes/identity.routes";
import { customersRouter } from "./routes/customers.routes";
import { storesRouter } from "./routes/stores.routes";
import { publicRouter } from "./routes/public.routes";
import { uploadRouter, assetsRouter } from "./routes/upload.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { suppliersRouter } from "./routes/suppliers.routes";
import { purchasesRouter } from "./routes/purchases.routes";
import { expensesRouter } from "./routes/expenses.routes";
import { shipmentsRouter } from "./routes/shipments.routes";
import { financeRouter } from "./routes/finance.routes";

export type Bindings = {
  astu_express_db?: D1Database;
  r2_express_db?: D1Database;
  astu_garment_db?: D1Database;
  matif_garment_db?: D1Database;
  astu_express_storage?: R2Bucket;
  astu_express?: R2Bucket;
  astu_express_r2?: R2Bucket;
  r2_express_assets?: R2Bucket;
  astu_g?: R2Bucket;
  astu_garment_r2?: R2Bucket;
  matif_garment_r2?: R2Bucket;
  BETTER_AUTH_SECRET?: string;
  CHAPA_SECRET_KEY?: string;
  CHAPA_WEBHOOK_SECRET?: string;
  API_BASE_URL?: string;
};

export type Variables = {
  user: any;
  session: any;
};

export function getDb(env: any): D1Database {
  return env?.astu_express_db || env?.r2_express_db || env?.astu_garment_db || env?.matif_garment_db;
}

export function getR2(env: any): R2Bucket | undefined {
  return (
    env?.astu_express_storage ||
    env?.astu_express ||
    env?.astu_express_r2 ||
    env?.r2_express_assets ||
    env?.astu_g ||
    env?.astu_garment_r2 ||
    env?.matif_garment_r2
  );
}

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8787",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8787",
];

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Enable Global CORS for Dashboard, Storefront & External Clients
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "";
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".workers.dev") ||
        origin.endsWith(".pages.dev") ||
        origin.startsWith("astuexpress://") ||
        origin.startsWith("exp://") ||
        origin.startsWith("myapp://") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.")
      ) {
        return origin;
      }
      return origin;
    },
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "Idempotency-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  })
);

// 2. Auto-initialize D1 Schema & 4 Default Roles if Not Yet Created
let isDbEnsured = false;
app.use("*", async (c, next) => {
  if (!isDbEnsured && c.req.path.startsWith("/api")) {
    const db = getDb(c.env);
    if (db) {
      try {
        const { ensureD1TablesAndSeedAdmin } = await import("./db/seed");
        await ensureD1TablesAndSeedAdmin(db, c.env.BETTER_AUTH_SECRET);
        isDbEnsured = true;
      } catch (e) {
        console.warn("Auto-seed skipped or failed:", e);
      }
    }
  }
  return next();
});

// 3. Mount Native Better Auth Web Standard Handler
app.all("/api/auth/*", async (c) => {
  const db = getDb(c.env);
  const baseURL = c.env.API_BASE_URL || new URL(c.req.url).origin;
  const auth = createAuth(db, c.env.BETTER_AUTH_SECRET, baseURL);
  return auth.handler(c.req.raw);
});

// 4. Root Welcome & Health Check
app.get("/", (c) => {
  return c.json({
    status: "online",
    service: "astu-express-api",
    version: "3.0.0",
    endpoints: {
      health: "/api/health",
      products: "/api/garments",
      orders: "/api/orders",
      customers: "/api/customers",
      stores: "/api/stores",
      staff: "/api/staff",
      suppliers: "/api/suppliers",
      purchases: "/api/purchases",
      expenses: "/api/expenses",
      shipments: "/api/shipments",
      finance: "/api/finance",
      betterAuth: "/api/auth/*",
    },
  });
});

app.get("/api/health", (c) => {
  const db = getDb(c.env);
  return c.json({
    status: "healthy",
    service: "astu-express-api",
    database: db ? "cloudflare-d1" : "fallback",
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount Modular Domain Sub-Routers
app.route("/api/garments", catalogRouter);
app.route("/api/products", catalogRouter);
app.route("/api/orders", ordersRouter);
app.route("/api/customers", customersRouter);
app.route("/api/stores", storesRouter);
app.route("/api/payments", paymentsRouter);
app.route("/api/upload", uploadRouter);
app.route("/api/assets", assetsRouter);
app.route("/api/suppliers", suppliersRouter);
app.route("/api/purchases", purchasesRouter);
app.route("/api/expenses", expensesRouter);
app.route("/api/shipments", shipmentsRouter);
app.route("/api/finance", financeRouter);
app.route("/api", identityRouter);
app.route("/", publicRouter);

// 6. Global Error Handling
app.onError((err, c) => {
  console.error("Global API Error:", err);
  return c.json(
    {
      success: false,
      error: err.message || "Internal Server Error",
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: `Route ${c.req.path} not found`,
    },
    404
  );
});

export default app;
