import { Hono } from "hono";
import { StoreRepository } from "../modules/stores/stores.repository";
import { StoreService } from "../modules/stores/stores.service";
import { requireRole, resolveD1, type Env } from "../middleware/auth";
import { validateJson } from "../middleware/validator";
import { CreateStoreSchema, UpdateStoreSchema } from "@astu/shared";

export const storesRouter = new Hono<Env>();

storesRouter.get("/", async (c) => {
  try {
    const repo = new StoreRepository(resolveD1(c.env));
    const service = new StoreService(repo);
    const list = await service.listStores();
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch stores" }, 500);
  }
});

storesRouter.post(
  "/",
  requireRole(["admin", "Admin"]),
  validateJson(CreateStoreSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const repo = new StoreRepository(resolveD1(c.env));
      const service = new StoreService(repo);
      const created = await service.createStore(body);
      return c.json(created, 201);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to create store" }, 400);
    }
  }
);

storesRouter.patch(
  "/:id",
  requireRole(["admin", "Admin"]),
  validateJson(UpdateStoreSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const repo = new StoreRepository(resolveD1(c.env));
      const service = new StoreService(repo);
      const updated = await service.updateStore(id, body);
      if (!updated) return c.json({ error: "Store not found" }, 404);
      return c.json(updated);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to update store" }, 400);
    }
  }
);

storesRouter.delete("/:id", requireRole(["admin", "Admin"]), async (c) => {
  try {
    const id = c.req.param("id");
    const repo = new StoreRepository(resolveD1(c.env));
    const service = new StoreService(repo);
    await service.deleteStore(id);
    return c.json({ success: true, message: "Store deleted successfully" });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to delete store" }, 400);
  }
});
