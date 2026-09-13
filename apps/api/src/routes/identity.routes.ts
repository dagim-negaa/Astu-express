import { Hono } from "hono";
import { createAuth } from "../lib/auth";
import { requireAuth, requireRole, optionalAuth, resolveD1, type Env } from "../middleware/auth";
import { validateJson } from "../middleware/validator";
import {
  LoginSchema,
  RegisterSchema,
  UpdateProfileSchema,
  UpdateCustomerProfileSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
} from "@astu/shared";

export const identityRouter = new Hono<Env>();

// ============================================================================
// AUTH & SESSION ENDPOINTS
// ============================================================================
identityRouter.post("/auth/sign-in", validateJson(LoginSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: c.req.raw.headers,
    });
    return c.json({
      success: true,
      token: (result as any)?.token,
      user: result.user,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Invalid email or password" },
      401
    );
  }
});

identityRouter.post("/auth/sign-up", validateJson(RegisterSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
    const result = await auth.api.signUpEmail({
      body: {
        name: body.name || "Customer",
        email: body.email,
        password: body.password,
        phone: body.phone,
      } as any,
      headers: c.req.raw.headers,
    });
    return c.json(
      {
        success: true,
        token: (result as any)?.token,
        user: result.user,
      },
      201
    );
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Sign-up failed" },
      400
    );
  }
});

identityRouter.post("/auth/sign-out", async (c) => {
  try {
    const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
    await auth.api.signOut({
      headers: c.req.raw.headers,
    });
    return c.json({ success: true });
  } catch {
    return c.json({ success: true });
  }
});

identityRouter.get("/me", async (c) => {
  try {
    const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ authenticated: false, error: "No active session" }, 401);
    }

    return c.json({
      authenticated: true,
      user: session.user,
      session: session.session,
    });
  } catch (err: any) {
    return c.json({ authenticated: false, error: "Authentication check failed" }, 401);
  }
});

identityRouter.on(
  ["PATCH", "POST", "PUT"],
  "/user/profile",
  requireAuth,
  validateJson(UpdateProfileSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const body = c.req.valid("json");
      const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);

      if (body.newPassword && body.oldPassword) {
        await auth.api.changePassword({
          body: {
            currentPassword: body.oldPassword,
            newPassword: body.newPassword,
            revokeOtherSessions: true,
          },
          headers: c.req.raw.headers,
        });
      }

      const updatedUser = await auth.api.updateUser({
        body: {
          name: body.name || currentUser.name,
        },
        headers: c.req.raw.headers,
      });

      return c.json({ success: true, user: updatedUser });
    } catch (err: any) {
      return c.json({ success: false, error: err.message || "Failed to update profile" }, 400);
    }
  }
);

identityRouter.on(
  ["PATCH", "POST", "PUT"],
  "/customer/profile",
  requireAuth,
  validateJson(UpdateCustomerProfileSchema),
  async (c) => {
    try {
      const sessionUser = c.get("user");
      const body = c.req.valid("json");
      const email = sessionUser.email.trim().toLowerCase();
      const name = body.name || sessionUser.name;
      const phone = body.phone;

      if (!email) {
        return c.json({ success: false, error: "Customer email is required" }, 400);
      }

      const d1 = resolveD1(c.env);
      const now = new Date().toISOString();

      // 1. Update Better Auth user profile if logged in
      if (sessionUser?.id) {
        try {
          await d1
            .prepare("UPDATE user SET name = COALESCE(?, name), phone = COALESCE(?, phone), updatedAt = ? WHERE id = ?;")
            .bind(name || null, phone || null, Date.now(), sessionUser.id)
            .run();
        } catch (err) {
          console.warn("User update warning:", err);
        }
      }

      // 2. Update or insert in D1 customers directory
      await d1
        .prepare(`
          INSERT INTO customers (id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 0, 0, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            name = COALESCE(excluded.name, customers.name),
            phone = COALESCE(excluded.phone, customers.phone),
            updatedAt = excluded.updatedAt;
        `)
        .bind(
          `cust-${crypto.randomUUID().slice(0, 8)}`,
          name || "Valued Client",
          email,
          phone || "N/A",
          now,
          now
        )
        .run();

      const customer = await d1
        .prepare("SELECT id, name, email, phone, ordersCount, totalSpentEtb, createdAt, updatedAt FROM customers WHERE email = ? LIMIT 1;")
        .bind(email)
        .first();

      return c.json({
        success: true,
        message: "Customer profile updated successfully",
        customer,
      });
    } catch (err: any) {
      return c.json({ success: false, error: err.message || "Failed to update customer profile" }, 400);
    }
  }
);

// ============================================================================
// STAFF MANAGEMENT VIA BETTER-AUTH ADMIN PLUGIN
// ============================================================================
function normalizeStaffRole(rawRole?: string): "Admin" | "Manager" | "Operator" | "Owner" {
  const r = (rawRole || "").toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "manager") return "Manager";
  if (r === "operator") return "Operator";
  return "Admin";
}

identityRouter.get(
  "/staff",
  requireRole(["admin", "Admin", "owner", "Owner"]),
  async (c) => {
    try {
      const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
      let staffList: any[] = [];
      try {
        const result = await auth.api.listUsers({
          query: {
            limit: 100,
          },
          headers: c.req.raw.headers,
        });

        const users = (result as any)?.users || [];
        staffList = users
          .filter((u: any) => {
            const r = (u.role || "").toLowerCase();
            return r === "admin" || r === "operator" || r === "manager" || r === "owner";
          })
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: normalizeStaffRole(u.role),
            status: u.banned ? "Inactive" : (u.status || "Active"),
            joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          }));
      } catch (listErr) {
        console.warn("Better auth listUsers fallback to D1:", listErr);
      }

      const d1 = resolveD1(c.env);
      if (staffList.length === 0 && d1) {
        const d1Staff = await d1
          .prepare("SELECT id, name, email, role, status, createdAt, banned FROM user WHERE lower(role) IN ('admin', 'operator', 'manager', 'owner')")
          .all();
        if (d1Staff.results) {
          staffList = d1Staff.results.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: normalizeStaffRole(u.role),
            status: u.banned ? "Inactive" : (u.status || "Active"),
            joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          }));
        }
      }

      return c.json(staffList);
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to list staff" }, 500);
    }
  }
);

identityRouter.post(
  "/staff",
  requireRole(["admin", "Admin", "owner", "Owner"]),
  validateJson(CreateStaffSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
      const rawRole = (body.role || "").toLowerCase();
      let targetRole = "operator";
      if (rawRole === "owner") targetRole = "owner";
      else if (rawRole === "admin") targetRole = "admin";
      else if (rawRole === "manager") targetRole = "manager";

      const newUser = await auth.api.createUser({
        body: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          password: body.password || "admin123",
          role: targetRole as any,
          data: {
            status: body.status || "Active",
          },
        },
        headers: c.req.raw.headers,
      });

      if (!newUser?.user) {
        throw new Error("Failed to register staff user in auth system");
      }

      // Explicitly guarantee role and status in D1
      const d1 = resolveD1(c.env);
      if (d1) {
        await d1
          .prepare("UPDATE user SET role = ?, status = ? WHERE id = ?")
          .bind(targetRole, body.status || "Active", newUser.user.id)
          .run();
      }

      return c.json(
        {
          id: newUser.user.id,
          name: newUser.user.name,
          email: newUser.user.email,
          role: normalizeStaffRole(targetRole),
          status: body.status || "Active",
          joinedDate: new Date().toISOString().split("T")[0],
        },
        201
      );
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to create staff member" }, 400);
    }
  }
);

identityRouter.patch(
  "/staff/:id",
  requireRole(["admin", "Admin", "owner", "Owner"]),
  validateJson(UpdateStaffSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const d1 = resolveD1(c.env);
      const auth = createAuth(d1, c.env.BETTER_AUTH_SECRET);

      if (body.role) {
        const rawRole = body.role.toLowerCase();
        let targetRole = "operator";
        if (rawRole === "owner") targetRole = "owner";
        else if (rawRole === "admin") targetRole = "admin";
        else if (rawRole === "manager") targetRole = "manager";

        await auth.api.setRole({
          body: {
            userId: id,
            role: targetRole as any,
          },
          headers: c.req.raw.headers,
        });
        if (d1) {
          await d1
            .prepare("UPDATE user SET role = ? WHERE id = ?")
            .bind(targetRole, id)
            .run();
        }
      }

      if (body.password) {
        await auth.api.setUserPassword({
          body: {
            userId: id,
            newPassword: body.password,
          },
          headers: c.req.raw.headers,
        });
      }

      if (body.status === "Inactive") {
        await auth.api.banUser({
          body: {
            userId: id,
            banReason: "Staff deactivated",
          },
          headers: c.req.raw.headers,
        });
        if (d1) {
          await d1
            .prepare("UPDATE user SET status = 'Inactive' WHERE id = ?")
            .bind(id)
            .run();
        }
      } else if (body.status === "Active") {
        await auth.api.unbanUser({
          body: {
            userId: id,
          },
          headers: c.req.raw.headers,
        });
        if (d1) {
          await d1
            .prepare("UPDATE user SET status = 'Active' WHERE id = ?")
            .bind(id)
            .run();
        }
      }

      if (body.name) {
        await auth.api.adminUpdateUser({
          body: {
            userId: id,
            data: {
              name: body.name,
            },
          },
          headers: c.req.raw.headers,
        });
        if (d1) {
          await d1
            .prepare("UPDATE user SET name = ? WHERE id = ?")
            .bind(body.name, id)
            .run();
        }
      }

      const fetched = await auth.api.getUser({
        query: { id },
        headers: c.req.raw.headers,
      });

      return c.json({
        success: true,
        staff: fetched
          ? {
              id: fetched.id,
              name: fetched.name,
              email: fetched.email,
              role: normalizeStaffRole(fetched.role),
              status: (fetched as any).banned ? "Inactive" : "Active",
              joinedDate: fetched.createdAt ? new Date(fetched.createdAt).toISOString().split("T")[0] : "",
            }
          : null,
      });
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to update staff member" }, 400);
    }
  }
);

identityRouter.delete("/staff/:id", requireRole(["admin", "Admin", "owner", "Owner"]), async (c) => {
  try {
    const id = c.req.param("id");
    const auth = createAuth(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
    await auth.api.removeUser({
      body: {
        userId: id,
      },
      headers: c.req.raw.headers,
    });
    const d1 = resolveD1(c.env);
    if (d1) {
      await d1
        .prepare("DELETE FROM user WHERE id = ?")
        .bind(id)
        .run();
    }
    return c.json({ success: true, message: "Staff member deleted successfully" });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to delete staff member" }, 500);
  }
});

identityRouter.on(
  ["POST", "GET"],
  "/admin/init-database",
  async (c, next) => {
    let hasAdmin = false;
    try {
      const d1 = resolveD1(c.env);
      if (d1) {
        const adminUser = await d1
          .prepare("SELECT id FROM user WHERE role IN ('admin', 'Admin') LIMIT 1")
          .first();
        if (adminUser) {
          hasAdmin = true;
        }
      }
    } catch {
      hasAdmin = false;
    }

    if (hasAdmin) {
      return requireRole(["admin", "Admin"])(c, next);
    }
    return next();
  },
  async (c) => {
    try {
      const { ensureD1TablesAndSeedAdmin } = await import("../db/seed");
      await ensureD1TablesAndSeedAdmin(resolveD1(c.env), c.env.BETTER_AUTH_SECRET);
      return c.json({ success: true, message: "Database schema ensured and admin verified successfully" });
    } catch (err: any) {
      return c.json({ error: err.message || "Failed to initialize database" }, 500);
    }
  }
);

identityRouter.post("/admin/reset-database", requireRole(["admin", "Admin"]), async (c) => {
  try {
    const { resetDatabase } = await import("../db/seed");
    await resetDatabase(resolveD1(c.env));
    return c.json({ success: true, message: "Database wiped and master admin re-seeded successfully." });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to reset database" }, 500);
  }
});
