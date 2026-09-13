import { Hono } from "hono";
import { requireRole, resolveR2, type Env } from "../middleware/auth";

export const uploadRouter = new Hono<Env>();
export const assetsRouter = new Hono<Env>();

const ALLOWED_VARIANTS = new Set(["thumb", "preview", "full"]);
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{4,64}$/;
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

// ============================================================================
// 1. STREAMING DIRECT-TO-R2 UPLOAD
// PUT /api/upload/:imageId/:variant
// ============================================================================
uploadRouter.put(
  "/:imageId/:variant",
  requireRole(["admin", "Admin", "operator", "Operator"]),
  async (c) => {
    try {
      const imageId = c.req.param("imageId");
      const variant = c.req.param("variant");

      if (!SAFE_ID_REGEX.test(imageId)) {
        return c.json({ error: "Invalid imageId format. Must be alphanumeric (4-64 chars)." }, 400);
      }

      if (!ALLOWED_VARIANTS.has(variant)) {
        return c.json({ error: "Invalid variant. Allowed variants: 'thumb', 'preview', 'full'." }, 400);
      }

      const r2 = resolveR2(c.env);
      if (!r2) {
        return c.json(
          { error: "R2 asset storage is not bound to the worker. Check wrangler.jsonc." },
          503
        );
      }

      const body = c.req.raw.body;
      if (!body) {
        return c.json({ error: "Missing binary image body." }, 400);
      }

      const key = `products/${imageId}/${variant}.webp`;

      await r2.put(key, body, {
        httpMetadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000, immutable",
        },
      });

      return c.json({
        success: true,
        imageId,
        variant,
        key,
        url: `/api/assets/${key}`,
      });
    } catch (err: any) {
      console.error("R2 Upload Error:", err);
      return c.json({ error: err.message || "Failed to stream image to R2" }, 500);
    }
  }
);

// ============================================================================
// 2. PUBLIC HIGH-SPEED ASSET SERVING & PROXY
// GET /api/assets/products/:imageId/:variant.webp
// GET /api/assets/products/:imageId
// GET /api/assets/proxy?url=...
// ============================================================================
async function serveFallbackImage(c: any): Promise<Response> {
  try {
    const fallbackRes = await fetch(FALLBACK_IMAGE_URL);
    if (fallbackRes.ok && fallbackRes.body) {
      const headers = new Headers();
      headers.set("content-type", fallbackRes.headers.get("content-type") || "image/jpeg");
      headers.set("cache-control", "public, max-age=86400");
      headers.set("vary", "Origin");
      return new Response(fallbackRes.body, { headers, status: 200 });
    }
  } catch {}
  return c.redirect(FALLBACK_IMAGE_URL, 302);
}

// Proxy any external or remote image with edge caching & CORS for mobile/web
assetsRouter.on(["GET", "HEAD"], "/proxy", async (c) => {
  const targetUrl = c.req.query("url");
  if (!targetUrl || typeof targetUrl !== "string") {
    return c.json({ error: "Missing 'url' query parameter." }, 400);
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return c.json({ error: "Invalid protocol. Only http and https URLs are supported." }, 400);
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "AstuGarment-AssetProxy/1.0",
        Accept: "image/*,*/*",
      },
    });

    if (!response.ok || !response.body) {
      return serveFallbackImage(c);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=604800, immutable");
    headers.set("vary", "Origin");

    if (c.req.method === "HEAD") {
      return new Response(null, { headers, status: 200 });
    }

    return new Response(response.body, { headers, status: 200 });
  } catch (err: any) {
    console.error("Asset Proxy Error:", err);
    return serveFallbackImage(c);
  }
});

// Single product image request defaulting to preview
assetsRouter.on(["GET", "HEAD"], "/products/:imageId", async (c) => {
  const imageId = c.req.param("imageId");
  return handleR2AssetRequest(c, imageId, "preview");
});

// Full variant asset request (e.g. /products/:imageId/preview.webp or /products/:imageId/thumb)
assetsRouter.on(["GET", "HEAD"], "/products/:imageId/:variantWithExt", async (c) => {
  const imageId = c.req.param("imageId");
  const variantWithExt = c.req.param("variantWithExt");
  const variant = variantWithExt.replace(/\.webp$/i, "");
  return handleR2AssetRequest(c, imageId, variant);
});

async function handleR2AssetRequest(c: any, imageId: string, variant: string): Promise<Response> {
  try {
    if (!SAFE_ID_REGEX.test(imageId) || !ALLOWED_VARIANTS.has(variant)) {
      return serveFallbackImage(c);
    }

    const r2 = resolveR2(c.env);
    if (!r2) {
      return serveFallbackImage(c);
    }

    const key = `products/${imageId}/${variant}.webp`;
    const object = await r2.get(key);

    if (!object) {
      return serveFallbackImage(c);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("content-type", "image/webp");
    headers.set("vary", "Origin");

    return new Response(object.body, { headers, status: 200 });
  } catch (err) {
    console.error("R2 Asset Serving Error:", err);
    return serveFallbackImage(c);
  }
}

