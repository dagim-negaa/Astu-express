import { Hono } from "hono";
import { CustomerRepository } from "../modules/customers/customers.repository";
import { CustomerService } from "../modules/customers/customers.service";
import { requireRole, resolveD1, type Env } from "../middleware/auth";
import { validateJson } from "../middleware/validator";
import { CreateCustomerSchema } from "@astu/shared";

export const customersRouter = new Hono<Env>();

customersRouter.get("/", requireRole(["admin", "Admin", "operator", "Operator"]), async (c) => {
  try {
    const repo = new CustomerRepository(resolveD1(c.env));
    const service = new CustomerService(repo);
    const list = await service.listCustomers();
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch customers" }, 500);
  }
});

customersRouter.post("/", validateJson(CreateCustomerSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const repo = new CustomerRepository(resolveD1(c.env));
    const service = new CustomerService(repo);
    const created = await service.createCustomer(body);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to create customer" }, 400);
  }
});
