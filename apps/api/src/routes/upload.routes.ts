import { Hono } from "hono";
import { requireRole, resolveR2, resolveD1, type Env } from "../middleware/auth";

export const uploadRouter = new Hono<Env>();
export const assetsRouter = new Hono<Env>();

const ALLOWED_VARIANTS = new Set(["thumb", "preview", "full"]);
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{3,128}$/;
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

// ============================================================================
// 1. DUAL STORAGE ENGINE (Cloudflare R2 + Built-in D1 Storage Fallback)
// ============================================================================

function inferMimeType(pathOrKey: string): string {
  const ext = pathOrKey.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    case "ico":
      return "image/x-icon";
    case "pdf":
      return "application/pdf";
    default:
      return "image/webp";
  }
}

function extractR2KeyFromUrl(rawUrl: string): string | null {
  try {
    const clean = rawUrl.trim();
    if (clean.startsWith("r2://")) {
      const parts = clean.replace("r2://", "").split("/");
      parts.shift();
      return parts.join("/");
    }
    if (clean.startsWith("/api/assets/") || clean.startsWith("/api/storage/") || clean.startsWith("/api/r2/")) {
      return clean.replace(/^\/api\/(?:assets|storage|r2)\//, "").replace(/^(?:storage|r2|raw)\//, "");
    }
    if (clean.includes(".r2.dev/")) {
      const parsed = new URL(clean);
      return parsed.pathname.replace(/^\/+/, "");
    }
    if (clean.includes(".r2.cloudflarestorage.com/")) {
      const parsed = new URL(clean);
      const parts = parsed.pathname.replace(/^\/+/, "").split("/");
      parts.shift();
      return parts.join("/");
    }
    if (clean.includes("/api/assets/")) {
      const parts = clean.split("/api/assets/");
      return parts[1]?.replace(/^(?:storage|r2|raw)\//, "") || null;
    }
    return null;
  } catch {
    return null;
  }
}

function streamR2Object(c: any, object: any, defaultMime = "image/webp"): Response {
  const clientEtag = c.req.header("if-none-match");
  if (clientEtag && (clientEtag === object.httpEtag || clientEtag === `W/${object.httpEtag}`)) {
    return new Response(null, { status: 304 });
  }

  const headers = new Headers();
  if (typeof object.writeHttpMetadata === "function") {
    object.writeHttpMetadata(headers);
  }

  if (object.httpEtag) {
    headers.set("etag", object.httpEtag);
  }
  if (!headers.has("content-type") || headers.get("content-type") === "application/octet-stream") {
    headers.set("content-type", defaultMime);
  }
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  headers.set("vary", "Origin, Accept-Encoding");

  if (c.req.method === "HEAD") {
    return new Response(null, { headers, status: 200 });
  }

  return new Response(object.body, { headers, status: 200 });
}

function streamD1Object(c: any, row: { data: any; contentType?: string; etag?: string }, defaultMime = "image/webp"): Response {
  const etag = row.etag || `"d1-${Date.now()}"`;
  const clientEtag = c.req.header("if-none-match");
  if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
    return new Response(null, { status: 304 });
  }

  const contentType = row.contentType || defaultMime;
  const headers = new Headers();
  headers.set("content-type", contentType);
  headers.set("etag", etag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  headers.set("vary", "Origin, Accept-Encoding");

  if (c.req.method === "HEAD") {
    return new Response(null, { headers, status: 200 });
  }

  let bodyData: BodyInit;
  if (row.data instanceof Uint8Array) {
    bodyData = row.data;
  } else if (row.data instanceof ArrayBuffer) {
    bodyData = row.data;
  } else if (ArrayBuffer.isView(row.data)) {
    bodyData = new Uint8Array(row.data.buffer, row.data.byteOffset, row.data.byteLength);
  } else if (Array.isArray(row.data)) {
    bodyData = new Uint8Array(row.data);
  } else {
    bodyData = new Uint8Array(row.data || 0);
  }

  return new Response(bodyData, { headers, status: 200 });
}

async function serveFallbackImage(c: any): Promise<Response> {
  try {
    const fallbackRes = await fetch(FALLBACK_IMAGE_URL);
    if (fallbackRes.ok && fallbackRes.body) {
      const headers = new Headers();
      headers.set("content-type", fallbackRes.headers.get("content-type") || "image/jpeg");
      headers.set("cache-control", "public, max-age=86400");
      headers.set("access-control-allow-origin", "*");
      headers.set("vary", "Origin");
      if (c.req.method === "HEAD") {
        return new Response(null, { headers, status: 200 });
      }
      return new Response(fallbackRes.body, { headers, status: 200 });
    }
  } catch {}
  return c.redirect(FALLBACK_IMAGE_URL, 302);
}

// Universal key resolver for R2 & D1 storage engine
async function serveR2Key(c: any, rawKey: string, requestedVariant?: string): Promise<Response> {
  const r2 = resolveR2(c.env);
  const d1 = resolveD1(c.env);

  // Clean key to normalize leading slashes, path traversal, query params
  const cleanKey = decodeURIComponent(rawKey.split("?")[0]).replace(/^\/+/, "").replace(/\.\.+/g, "");
  if (!cleanKey) {
    return serveFallbackImage(c);
  }

  const candidates: string[] = [];

  // 1. If explicit variant requested (e.g. 'thumb', 'preview', 'full')
  if (requestedVariant && ALLOWED_VARIANTS.has(requestedVariant)) {
    if (!cleanKey.includes("/")) {
      candidates.push(`products/${cleanKey}/${requestedVariant}.webp`);
    } else {
      candidates.push(`${cleanKey.replace(/\.[a-zA-Z0-9]+$/, "")}/${requestedVariant}.webp`);
    }
  }

  // 2. Direct exact key match
  candidates.push(cleanKey);

  // 3. If the key has no extension (e.g. "img_123" or "products/img_123")
  if (!cleanKey.includes(".")) {
    if (!cleanKey.startsWith("products/")) {
      candidates.push(`products/${cleanKey}/preview.webp`);
      candidates.push(`products/${cleanKey}/full.webp`);
      candidates.push(`products/${cleanKey}/thumb.webp`);
      candidates.push(`products/${cleanKey}`);
    } else {
      candidates.push(`${cleanKey}/preview.webp`);
      candidates.push(`${cleanKey}/full.webp`);
      candidates.push(`${cleanKey}/thumb.webp`);
    }
    candidates.push(`${cleanKey}.webp`);
    candidates.push(`${cleanKey}.jpg`);
    candidates.push(`${cleanKey}.png`);
  }

  // Check 1: Cloudflare R2 bucket
  if (r2) {
    for (const candidate of candidates) {
      try {
        const object = await r2.get(candidate);
        if (object) {
          return streamR2Object(c, object, inferMimeType(candidate));
        }
      } catch (err) {
        console.warn(`R2 lookup failed for "${candidate}":`, err);
      }
    }
  }

  // Check 2: Built-in D1 Storage Engine (storage_objects table)
  if (d1) {
    for (const candidate of candidates) {
      try {
        const row = await d1
          .prepare("SELECT data, contentType, size, etag FROM storage_objects WHERE key = ? LIMIT 1")
          .bind(candidate)
          .first<{ data: any; contentType: string; size: number; etag: string }>();

        if (row && row.data) {
          return streamD1Object(c, row, inferMimeType(candidate));
        }
      } catch (err) {
        console.warn(`D1 storage lookup error for "${candidate}":`, err);
      }
    }
  }

  if (c.req.query("fallback") === "false") {
    return c.json({ error: `Asset not found in storage: ${cleanKey}` }, 404);
  }

  return serveFallbackImage(c);
}

// ============================================================================
// 2. STREAMING UPLOAD ROUTE (Direct to R2 + D1 Storage Engine)
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
        return c.json({ error: "Invalid imageId format. Must be alphanumeric (3-128 chars)." }, 400);
      }

      if (!ALLOWED_VARIANTS.has(variant)) {
        return c.json({ error: "Invalid variant. Allowed variants: 'thumb', 'preview', 'full'." }, 400);
      }

      const r2 = resolveR2(c.env);
      const d1 = resolveD1(c.env);
      if (!r2 && !d1) {
        return c.json(
          { error: "No storage backend available (neither R2 nor D1 bound)." },
          503
        );
      }

      const body = await c.req.raw.arrayBuffer();
      if (!body || body.byteLength === 0) {
        return c.json({ error: "Missing binary image body." }, 400);
      }

      const key = `products/${imageId}/${variant}.webp`;
      const etag = `"${imageId}-${variant}-${body.byteLength}"`;

      // 1. If R2 is bound, save to Cloudflare R2
      if (r2) {
        try {
          await r2.put(key, body, {
            httpMetadata: {
              contentType: "image/webp",
              cacheControl: "public, max-age=31536000, immutable",
            },
          });
        } catch (r2Err) {
          console.warn("R2 Put failed, persisting to D1 storage engine:", r2Err);
        }
      }

      // 2. Always persist to D1 storage_objects table as reliable fallback
      if (d1) {
        try {
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
            .bind(key, new Uint8Array(body), "image/webp", body.byteLength, etag, Date.now())
            .run();
        } catch (d1Err) {
          console.error("D1 storage insert error:", d1Err);
          if (!r2) {
            throw d1Err;
          }
        }
      }

      return c.json({
        success: true,
        imageId,
        variant,
        key,
        url: `/api/assets/${key}`,
      });
    } catch (err: any) {
      console.error("Upload Error:", err);
      return c.json({ error: err.message || "Failed to persist image to storage" }, 500);
    }
  }
);

// ============================================================================
// 3. HIGH-SPEED ASSET SERVING & PROXY ROUTER
// ============================================================================

// CORS OPTIONS preflight
assetsRouter.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization, Range, If-None-Match",
      "access-control-max-age": "86400",
    },
  });
});

// GET/HEAD /proxy - Universal image display proxy:
// Supports ?key=... (R2/D1 storage key), ?imageId=... (Product image ID), or ?url=... (R2 or external URL)
assetsRouter.on(["GET", "HEAD"], "/proxy", async (c) => {
  const keyParam = c.req.query("key") || c.req.query("imageId");
  const variantParam = c.req.query("variant");

  // A. Key or ImageId specified directly -> Display directly from storage
  if (keyParam) {
    return serveR2Key(c, keyParam, variantParam);
  }

  // B. Target URL specified
  const targetUrl = c.req.query("url");
  if (!targetUrl || typeof targetUrl !== "string") {
    return c.json({ error: "Missing 'key' or 'url' query parameter." }, 400);
  }

  // Check if targetUrl references a storage path or domain
  const r2Key = extractR2KeyFromUrl(targetUrl);
  if (r2Key) {
    const r2Res = await serveR2Key(c, r2Key, variantParam);
    if (r2Res.status !== 404 && r2Res.status !== 302) {
      return r2Res;
    }
  }

  // C. Fetch external HTTP/HTTPS URL with edge caching & CORS
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

    const contentType = response.headers.get("content-type") || inferMimeType(parsed.pathname);
    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=604800, immutable");
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
    headers.set("vary", "Origin, Accept-Encoding");

    const etag = response.headers.get("etag");
    if (etag) {
      headers.set("etag", etag);
      const clientEtag = c.req.header("if-none-match");
      if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
        return new Response(null, { status: 304 });
      }
    }

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
  return serveR2Key(c, imageId, "preview");
});

// Full variant asset request (e.g. /products/:imageId/preview.webp or /products/:imageId/thumb)
assetsRouter.on(["GET", "HEAD"], "/products/:imageId/:variantWithExt", async (c) => {
  const imageId = c.req.param("imageId");
  const variantWithExt = c.req.param("variantWithExt");
  const variant = variantWithExt.replace(/\.[a-zA-Z0-9]+$/i, "");
  return serveR2Key(c, `products/${imageId}/${variantWithExt}`, variant);
});

// Dedicated storage & r2 path proxies
assetsRouter.on(["GET", "HEAD"], "/storage/*", async (c) => {
  const raw = c.req.path.replace(/^\/(?:api\/assets\/storage|api\/storage|storage)\//, "");
  return serveR2Key(c, raw, c.req.query("variant"));
});

assetsRouter.on(["GET", "HEAD"], "/r2/*", async (c) => {
  const raw = c.req.path.replace(/^\/(?:api\/assets\/r2|api\/r2|r2)\//, "");
  return serveR2Key(c, raw, c.req.query("variant"));
});

assetsRouter.on(["GET", "HEAD"], "/raw/*", async (c) => {
  const raw = c.req.path.replace(/^\/(?:api\/assets\/raw|api\/raw|raw)\//, "");
  return serveR2Key(c, raw, c.req.query("variant"));
});

// Catch-all route for any other asset key
assetsRouter.on(["GET", "HEAD"], "/*", async (c) => {
  const key = c.req.path
    .replace(/^\/api\/(?:assets|storage|r2)\//, "")
    .replace(/^\/(?:assets|storage|r2)\//, "")
    .replace(/^\/+/, "");

  if (!key || key === "proxy") {
    return serveFallbackImage(c);
  }

  return serveR2Key(c, key, c.req.query("variant"));
});
