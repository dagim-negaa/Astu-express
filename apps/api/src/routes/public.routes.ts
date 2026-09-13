import { Hono } from "hono";
import { CatalogRepository } from "../modules/catalog/catalog.repository";
import { resolveD1, type Env } from "../middleware/auth";

export const publicRouter = new Hono<Env>();

publicRouter.get("/privacy", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - ASTU Garment</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; background-color: #f8fafc; }
    h1 { color: #0284c7; font-family: "EB Garamond", Georgia, serif; font-size: 2rem; }
    h2 { color: #8b3224; font-family: "EB Garamond", Georgia, serif; }
  </style>
</head>
<body>
  <h1>ASTU Garment Privacy Policy</h1>
  <p><strong>Last Updated:</strong> September 8, 2026</p>
  <p>Welcome to ASTU Garment. We value your privacy and are committed to protecting your personal data in compliance with international privacy standards.</p>
  <h2>1. Data Collection</h2>
  <p>We only collect information necessary to process ready-to-wear clothing orders and provide secure customer access.</p>
  <h2>2. Account Deletion & Rights</h2>
  <p>You may request deletion of your account and associated data directly in the mobile app profile settings or by contacting our atelier support.</p>
</body>
</html>`;
  return c.html(html);
});

publicRouter.get("/share", async (c) => {
  const id = c.req.query("id");
  let title = "ASTU Luxury Garment";
  let description = "Handcrafted ready-to-wear Ethiopian luxury garment from ASTU Atelier.";
  let image = "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

  const d1 = resolveD1(c.env);
  if (id && d1) {
    try {
      const repo = new CatalogRepository(d1);
      const item = await repo.findById(id);
      if (item) {
        title = item.title || item.name || title;
        description = item.description || description;
        image = item.imageUrl || image;
      }
    } catch {
      // Fallback to defaults
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
</body>
</html>`;
  return c.html(html);
});
