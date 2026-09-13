import { Hono } from "hono";
import { CatalogRepository } from "../modules/catalog/catalog.repository";
import { CatalogService } from "../modules/catalog/catalog.service";
import { requireRole, resolveD1, type Env } from "../middleware/auth";
import { validateJson, validateQuery } from "../middleware/validator";
import {
  CreateGarmentSchema,
  UpdateStockSchema,
  ToggleSpotlightSchema,
  CatalogQuerySchema,
} from "@astu/shared";

export const catalogRouter = new Hono<Env>();

catalogRouter.get("/", validateQuery(CatalogQuerySchema), async (c) => {
  try {
    const query = c.req.valid("query");
    const category = query.category;
    const search = query.search;
    const storeId = query.storeId;
    const material = query.material || query.materials;
    const isFeaturedParam = query.isFeatured;
    const limit = query.limit;
    const offset = query.offset;
    const page = query.page;

    const isFeatured =
      isFeaturedParam !== undefined
        ? isFeaturedParam === true || isFeaturedParam === "true" || isFeaturedParam === "1"
        : undefined;

    const repo = new CatalogRepository(resolveD1(c.env));
    const service = new CatalogService(repo);
    const items = await service.listProducts({
      category,
      search,
      storeId,
      isFeatured,
      material,
      limit,
      offset,
      page,
    });
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch garments" }, 500);
  }
});

catalogRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const repo = new CatalogRepository(resolveD1(c.env));
    const service = new CatalogService(repo);
    const item = await service.getProduct(id);
    if (!item) return c.json({ error: "Garment not found" }, 404);
    return c.json(item);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch garment" }, 500);
  }
});

catalogRouter.post(
  "/",
  requireRole(["admin", "Admin", "operator", "Operator"]),
  validateJson(CreateGarmentSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const repo = new CatalogRepository(resolveD1(c.env));
      const service = new CatalogService(repo);
      const created = await service.createProduct(body);
      return c.json(created, 201);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to create garment" }, 400);
    }
  }
);

catalogRouter.patch(
  "/:id/stock",
  requireRole(["admin", "Admin", "operator", "Operator"]),
  validateJson(UpdateStockSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const stockQuantity = (body.stockQuantity ?? body.quantity) as number;
      const initialStock = body.initialStock;

      const repo = new CatalogRepository(resolveD1(c.env));
      const service = new CatalogService(repo);
      const updated = await service.updateStock(
        id,
        Number(stockQuantity),
        initialStock !== undefined ? Number(initialStock) : undefined
      );
      return c.json(updated);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to update stock" }, 400);
    }
  }
);

catalogRouter.patch("/:id/spotlight", requireRole(["admin", "Admin", "operator", "Operator"]), async (c) => {
  try {
    const id = c.req.param("id");
    let isFeaturedExplicit: boolean | undefined = undefined;
    try {
      const raw = await c.req.json();
      const parsed = ToggleSpotlightSchema.safeParse(raw);
      if (parsed.success && parsed.data && typeof parsed.data.isFeatured === "boolean") {
        isFeaturedExplicit = parsed.data.isFeatured;
      }
    } catch {
      // Body is optional
    }
    const repo = new CatalogRepository(resolveD1(c.env));
    const service = new CatalogService(repo);
    const result = await service.toggleSpotlight(id, isFeaturedExplicit);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to toggle spotlight" }, 400);
  }
});

catalogRouter.delete("/:id", requireRole(["admin", "Admin", "operator", "Operator"]), async (c) => {
  try {
    const id = c.req.param("id");
    const repo = new CatalogRepository(resolveD1(c.env));
    const service = new CatalogService(repo);
    await service.deleteProduct(id);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to delete garment" }, 500);
  }
});

catalogRouter.delete("/", requireRole(["admin", "Admin"]), async (c) => {
  try {
    const repo = new CatalogRepository(resolveD1(c.env));
    const service = new CatalogService(repo);
    await service.clearAllProducts();
    return c.json({ success: true, message: "Catalog flushed successfully" });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to clear catalog" }, 500);
  }
});
