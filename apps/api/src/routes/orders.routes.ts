import { Hono } from "hono";
import { OrderRepository } from "../modules/orders/orders.repository";
import { OrderService } from "../modules/orders/orders.service";
import { optionalAuth, requireRole, resolveD1, type Env } from "../middleware/auth";
import { validateJson, validateQuery } from "../middleware/validator";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  OrderQuerySchema,
} from "@astu/shared";

export const ordersRouter = new Hono<Env>();

/**
 * Public Order Tracking Endpoint
 * Searches by tracking number, order ID, or shipment tracking code
 * Returns live delivery timeline, carrier, and package item details
 */
ordersRouter.get("/track/:trackingNumber", async (c) => {
  try {
    const trackingNumber = c.req.param("trackingNumber");
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return c.json({ error: "Tracking number or order ID is required" }, 400);
    }
    const repo = new OrderRepository(resolveD1(c.env));
    const service = new OrderService(repo);
    const trackingInfo = await service.trackOrder(trackingNumber);
    if (!trackingInfo) {
      return c.json({
        error: `No shipment found matching tracking number or order ID "${trackingNumber}". Please check the number and try again.`
      }, 404);
    }
    return c.json({ success: true, data: trackingInfo });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to track order" }, 500);
  }
});

ordersRouter.get("/", optionalAuth, validateQuery(OrderQuerySchema), async (c) => {
  try {
    const query = c.req.valid("query");
    const status = query.status;
    const queryEmail = query.email || query.customerEmail;
    const trackingNumber = query.trackingNumber;
    const searchQuery = query.query || query.q;
    const orderSource = query.orderSource;
    const storeId = query.storeId;
    const limit = query.limit;
    const offset = query.offset;
    const page = query.page;

    const user = c.get("user");
    let customerEmail: string | undefined = undefined;

    if (user) {
      const userRole = (user.role || "").toLowerCase();
      const isStaff = ["admin", "operator", "manager"].includes(userRole);
      if (isStaff) {
        customerEmail = queryEmail || undefined;
      } else {
        // Regular customer can only view their own orders
        customerEmail = user.email;
      }
    } else {
      // Unauthenticated guest request
      if (trackingNumber || searchQuery) {
        // Allowed: searching directly by tracking number or order reference
      } else if (queryEmail) {
        customerEmail = queryEmail;
      } else {
        return c.json({ error: "Unauthorized: Please sign in or provide email/tracking number to view orders" }, 401);
      }
    }

    const repo = new OrderRepository(resolveD1(c.env));
    const service = new OrderService(repo);
    const items = await service.listOrders({
      status,
      customerEmail,
      trackingNumber,
      query: searchQuery,
      orderSource,
      storeId,
      limit,
      offset,
      page,
    });
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch orders" }, 500);
  }
});

ordersRouter.get("/:id", optionalAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const queryEmail = c.req.query("email")?.trim().toLowerCase();
    const repo = new OrderRepository(resolveD1(c.env));
    const service = new OrderService(repo);
    const order = await service.getOrder(id);
    if (!order) return c.json({ error: "Order not found" }, 404);

    const user = c.get("user");
    const orderEmail = (order.customerEmail || "").toLowerCase();

    if (user) {
      const userRole = (user.role || "").toLowerCase();
      const isStaff = ["admin", "operator", "manager"].includes(userRole);
      if (!isStaff && orderEmail !== user.email.toLowerCase()) {
        return c.json({ error: "Forbidden: You cannot view this order" }, 403);
      }
    } else {
      // Unauthenticated guest must provide verified matching customer email to prevent IDOR scraping
      if (!queryEmail || queryEmail !== orderEmail) {
        return c.json({ error: "Unauthorized: Please sign in or provide the verified customer email to view this order" }, 401);
      }
    }

    return c.json(order);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch order" }, 500);
  }
});

ordersRouter.post("/", validateJson(CreateOrderSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const items = body.items || [];
    const repo = new OrderRepository(resolveD1(c.env));
    const service = new OrderService(repo);
    const created = await service.createOrder(body, items);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to place order" }, 400);
  }
});

ordersRouter.patch(
  "/:id/status",
  requireRole(["admin", "Admin", "operator", "Operator"]),
  validateJson(UpdateOrderStatusSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const { status, paymentStatus } = c.req.valid("json");
      const repo = new OrderRepository(resolveD1(c.env));
      const service = new OrderService(repo);
      const updated = await service.updateStatus(id, status, paymentStatus);
      return c.json(updated);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to update order status" }, 400);
    }
  }
);

/**
 * Customer Delivery Confirmation Seam (Fix Mobile 403 Bug)
 * Allows authenticated customers or verified guests to confirm receipt of their order
 */
ordersRouter.post("/:id/confirm-receipt", optionalAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const repo = new OrderRepository(resolveD1(c.env));
    const service = new OrderService(repo);
    const order = await service.getOrder(id);

    if (!order) return c.json({ error: "Order not found" }, 404);

    const orderEmail = (order.customerEmail || "").toLowerCase();

    if (user) {
      const userRole = (user.role || "").toLowerCase();
      const isStaff = ["admin", "operator", "manager"].includes(userRole);
      if (!isStaff && orderEmail !== user.email.toLowerCase()) {
        return c.json({ error: "Forbidden: You do not own this order" }, 403);
      }
    } else {
      const body = await c.req.json().catch(() => ({}));
      const queryEmail = c.req.query("email")?.trim().toLowerCase();
      const providedEmail = (body.email || queryEmail || "").toLowerCase().trim();
      if (!providedEmail || providedEmail !== orderEmail) {
        return c.json({ error: "Unauthorized: Verified customer email required to confirm delivery" }, 401);
      }
    }

    const updated = await service.confirmReceipt(id);
    return c.json({ success: true, order: updated });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to confirm delivery" }, 400);
  }
});
