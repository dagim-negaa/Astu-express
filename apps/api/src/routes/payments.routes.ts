import { Hono } from "hono";
import { OrderRepository } from "../modules/orders/orders.repository";
import { OrderService } from "../modules/orders/orders.service";
import { ChapaService } from "../modules/payments/chapa.service";
import { optionalAuth, resolveD1, type Env } from "../middleware/auth";
import { validateJson } from "../middleware/validator";
import {
  InitializeChapaPaymentSchema,
  VerifyChapaPaymentSchema,
  normalizeEthiopianPhone,
} from "@astu/shared";

export const paymentsRouter = new Hono<Env>();

const DEFAULT_CHAPA_TEST_SECRET = "CHASECK_TEST-pfSBD10j33oyLMh6L8wRhPmuRDW8RvLd";
const DEFAULT_CHAPA_WEBHOOK_SECRET = "astu_webhook_secret_2026_secure_key";

/**
 * 1. Initialize Chapa Payment Session
 * Atomically checks stock, creates pending order, and retrieves Chapa checkout URL
 */
paymentsRouter.post(
  "/chapa/initialize",
  optionalAuth,
  validateJson(InitializeChapaPaymentSchema),
  async (c) => {
    try {
      const secretKey = c.env.CHAPA_SECRET_KEY || DEFAULT_CHAPA_TEST_SECRET;
      if (!secretKey) {
        return c.json(
          {
            success: false,
            error: "Payment configuration missing: CHAPA_SECRET_KEY is not configured.",
          },
          500
        );
      }

      const body = c.req.valid("json");
      const repo = new OrderRepository(resolveD1(c.env));
      const orderService = new OrderService(repo);

      // Unique collision-resistant transaction reference for Chapa
      const rawOrderId = body.orderId || `ord-${crypto.randomUUID().slice(0, 8)}`;
      const txRef = `ASTU-${rawOrderId.slice(-6).toUpperCase()}-${Date.now()}`;

      // Normalize phone number to Ethiopian 10-digit standard
      const cleanPhone = normalizeEthiopianPhone(body.customerPhone);

      // Split customer name into First and Last
      const nameParts = (body.customerName || "Valued Client").trim().split(/\s+/);
      const firstName = nameParts[0] || "Valued";
      const lastName = nameParts.slice(1).join(" ") || "Client";

      // 1. Create or retrieve the Order with atomic stock reservation
      let targetOrder: any = null;
      if (body.orderId) {
        targetOrder = await orderService.getOrder(body.orderId);
      }

      if (!targetOrder) {
        targetOrder = await orderService.createOrder(
          {
            id: rawOrderId,
            customerName: body.customerName,
            customerEmail: body.customerEmail,
            customerPhone: cleanPhone,
            garmentTitle: body.garmentTitle,
            garmentSku: body.garmentSku,
            quantity: body.quantity || 1,
            items: body.items,
            totalPriceEtb: body.totalPriceEtb,
            paymentMethod: "chapa",
            paymentStatus: "pending",
            paymentTxRef: txRef,
            paymentProvider: "chapa",
            shippingAddress: body.shippingAddress || "Addis Ababa, Ethiopia",
            orderSource: body.orderSource || "app",
            storeId: body.storeId || null,
            status: "pending",
            promoCode: body.promoCode || null,
          },
          body.items
        );
      } else {
        // Update existing order with the new txRef
        await resolveD1(c.env)
          .prepare(
            "UPDATE orders SET paymentTxRef = ?, paymentMethod = 'chapa', paymentProvider = 'chapa', paymentStatus = 'pending', updatedAt = ? WHERE id = ?;"
          )
          .bind(txRef, new Date().toISOString(), targetOrder.id)
          .run();
        targetOrder = await orderService.getOrder(targetOrder.id);
      }

      const payableAmount = targetOrder?.totalPriceEtb ?? body.totalPriceEtb ?? 0;
      if (payableAmount <= 0) {
        return c.json({ success: false, error: "Order total amount must be greater than zero." }, 400);
      }

      const apiBaseUrl = (c.env.API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
      const callbackUrl = `${apiBaseUrl}/api/payments/chapa/callback`;
      const baseReturnUrl = body.returnUrl || "astugarment://payment/callback";

      // Chapa strictly requires return_url to be an HTTP(S) URL.
      // If client provides a custom scheme (e.g. astugarment://), route through the worker callback which redirects to the custom scheme.
      let returnUrl: string;
      if (baseReturnUrl.startsWith("http://") || baseReturnUrl.startsWith("https://")) {
        const separator = baseReturnUrl.includes("?") ? "&" : "?";
        returnUrl = `${baseReturnUrl}${separator}tx_ref=${encodeURIComponent(txRef)}&order_id=${encodeURIComponent(targetOrder.id)}`;
      } else {
        returnUrl = `${callbackUrl}?tx_ref=${encodeURIComponent(txRef)}&order_id=${encodeURIComponent(targetOrder.id)}&app_redirect=${encodeURIComponent(baseReturnUrl)}`;
      }

      // 2. Call Chapa API to generate hosted payment URL
      const chapa = new ChapaService(secretKey);
      const chapaResult = await chapa.initializeTransaction({
        amount: payableAmount,
        currency: "ETB",
        email: body.customerEmail,
        firstName,
        lastName,
        phoneNumber: cleanPhone,
        txRef,
        callbackUrl,
        returnUrl,
        title: "ASTU Garment",
        description: `Order ${targetOrder.id} - ASTU Luxury Bespoke Fashion`,
        meta: {
          orderId: targetOrder.id,
          customerEmail: body.customerEmail,
        },
      });

      return c.json(
        {
          success: true,
          checkoutUrl: chapaResult.checkoutUrl,
          txRef,
          orderId: targetOrder.id,
          data: {
            checkoutUrl: chapaResult.checkoutUrl,
            txRef,
            orderId: targetOrder.id,
          },
        },
        200
      );
    } catch (err: any) {
      console.error("Chapa Initialize Endpoint Error:", err);
      return c.json(
        {
          success: false,
          error: err.message || "Failed to initialize Chapa payment.",
        },
        400
      );
    }
  }
);

/**
 * 2. Verify Chapa Transaction
 * Authoritatively confirms payment with Chapa server and updates order to 'paid' / 'processing'
 */
paymentsRouter.post(
  "/chapa/verify",
  optionalAuth,
  validateJson(VerifyChapaPaymentSchema),
  async (c) => {
    try {
      const secretKey = c.env.CHAPA_SECRET_KEY || DEFAULT_CHAPA_TEST_SECRET;
      if (!secretKey) {
        return c.json({ success: false, error: "Payment configuration missing: CHAPA_SECRET_KEY." }, 500);
      }

      const { txRef, orderId } = c.req.valid("json");
      const repo = new OrderRepository(resolveD1(c.env));
      const orderService = new OrderService(repo);

      // Find the associated order
      let order: any = null;
      if (txRef) {
        order = await orderService.findByTxRef(txRef);
      }
      if (!order && orderId) {
        order = await orderService.getOrder(orderId);
      }

      // Query Chapa server-to-server
      const chapa = new ChapaService(secretKey);
      const verifyResult = await chapa.verifyTransaction(txRef);

      if (verifyResult.success) {
        if (order) {
          const updated = await orderService.updatePaymentSuccess(
            order.id,
            verifyResult.reference,
            verifyResult.paymentMethod,
            new Date().toISOString()
          );
          return c.json({
            success: true,
            data: {
              status: "paid",
              order: updated,
              chapa: verifyResult,
            },
          });
        }
        return c.json({
          success: true,
          data: {
            status: "paid",
            chapa: verifyResult,
          },
        });
      } else {
        if (order && verifyResult.status === "failed") {
          await orderService.updatePaymentFailed(order.id);
        }
        return c.json(
          {
            success: false,
            error: "Payment has not yet been confirmed by Chapa.",
            data: verifyResult,
          },
          400
        );
      }
    } catch (err: any) {
      console.error("Chapa Verify Endpoint Error:", err);
      return c.json(
        {
          success: false,
          error: err.message || "Failed to verify transaction.",
        },
        400
      );
    }
  }
);

/**
 * 3. Chapa Callback URL
 * Invoked by Chapa on transaction completion
 */
paymentsRouter.get("/chapa/callback", async (c) => {
  try {
    const txRef = c.req.query("trx_ref") || c.req.query("tx_ref");
    const status = c.req.query("status") || "paid";
    const refId = c.req.query("ref_id");
    const appRedirect = c.req.query("app_redirect") || "astugarment://payment/callback";
    const orderIdParam = c.req.query("order_id");

    let finalOrderId = orderIdParam;

    if (txRef) {
      const repo = new OrderRepository(resolveD1(c.env));
      const orderService = new OrderService(repo);
      const order = await orderService.findByTxRef(txRef);

      if (order && (status === "success" || status === "paid")) {
        await orderService.updatePaymentSuccess(order.id, refId || undefined, "chapa", new Date().toISOString());
        finalOrderId = order.id;
      }
    }

    const sep = appRedirect.includes("?") ? "&" : "?";
    const deepLinkUrl = `${appRedirect}${sep}tx_ref=${encodeURIComponent(txRef || "")}&order_id=${encodeURIComponent(finalOrderId || "")}&status=${encodeURIComponent(status)}`;

    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>ASTU Garment — Payment Confirmed</title>
          <script>
            try {
              window.location.href = "${deepLinkUrl}";
            } catch (e) {}
          </script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
            body { font-family: "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .badge { display: inline-block; background: #fdf2f0; color: #8b3224; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #fecdd3; }
            h1 { font-family: "EB Garamond", Georgia, serif; font-size: 26px; margin: 0 0 12px; color: #38bdf8; letter-spacing: 0.02em; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; padding: 12px 28px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); }
            .btn:hover { background: #0284c7; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">ASTU Atelier</div>
            <h1>ASTU Garment</h1>
            <p>Your payment details have been recorded. You may now return to the ASTU Garment mobile app to track your order.</p>
            <a class="btn" href="${deepLinkUrl}">Return to App</a>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    return c.text("Callback processed", 200);
  }
});

/**
 * 4. Chapa Webhook Listener
 * Asynchronously handles signed webhook events with HMAC-SHA256 signature verification
 */
paymentsRouter.post("/chapa/webhook", async (c) => {
  try {
    const webhookSecret = c.env.CHAPA_WEBHOOK_SECRET || DEFAULT_CHAPA_WEBHOOK_SECRET;
    const signatureHeader = c.req.header("x-chapa-signature") || c.req.header("chapa-signature") || null;
    const rawBody = await c.req.text();

    // 1. Verify Webhook Authenticity
    if (webhookSecret) {
      const isValid = await ChapaService.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        console.warn("Chapa Webhook: Invalid HMAC signature rejected.", {
          signatureHeader,
          bodyLength: rawBody.length,
        });
        return c.json({ error: "Invalid webhook signature" }, 401);
      }
    }

    // 2. Parse Webhook Event Body
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    const event = payload.event;
    const status = (payload.status || "").toLowerCase();
    const txRef = payload.tx_ref || payload.reference;

    if (!txRef) {
      return c.json({ received: true, note: "No tx_ref in payload" }, 200);
    }

    const repo = new OrderRepository(resolveD1(c.env));
    const orderService = new OrderService(repo);
    const order = await orderService.findByTxRef(txRef);

    if (order) {
      if (event === "charge.success" && (status === "success" || status === "paid")) {
        const paymentReference = payload.reference || payload.chapa_reference;
        const paymentProvider = payload.method || payload.type || payload.payment_method || "chapa";
        const paidAt = payload.created_at || payload.updated_at || new Date().toISOString();
        await orderService.updatePaymentSuccess(order.id, paymentReference, paymentProvider, paidAt);
        console.log(`Chapa Webhook: Order ${order.id} marked as PAID. Provider: ${paymentProvider}, Ref: ${paymentReference}`);
      } else if (event === "charge.failed/cancelled" || status === "failed") {
        await orderService.updatePaymentFailed(order.id);
        console.log(`Chapa Webhook: Order ${order.id} marked as FAILED.`);
      }
    }

    return c.json({ success: true, received: true }, 200);
  } catch (err: any) {
    console.error("Chapa Webhook Exception:", err);
    return c.json({ error: err.message || "Webhook error" }, 500);
  }
});
