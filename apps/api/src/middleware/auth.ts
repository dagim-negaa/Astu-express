import { createMiddleware } from 'hono/factory';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { createAuth } from '../lib/auth';

export type Env = {
  Bindings: {
    astu_garment_db?: D1Database;
    matif_garment_db?: D1Database;
    astu_g?: R2Bucket;
    astu_garment_r2?: R2Bucket;
    matif_garment_r2?: R2Bucket;
    BETTER_AUTH_SECRET?: string;
    CHAPA_SECRET_KEY?: string;
    CHAPA_WEBHOOK_SECRET?: string;
    API_BASE_URL?: string;
  };
  Variables: {
    user: any;
    session: any;
  };
};

export function resolveD1(env: any): D1Database {
  return env?.r2_express_db || env?.astu_express_db || env?.astu_garment_db || env?.matif_garment_db;
}

export function resolveR2(env: any): R2Bucket | undefined {
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

/**
 * Validates session using Better Auth API handler with incoming headers
 */
export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const d1 = resolveD1(c.env);
  if (!d1) {
    return c.json({ success: false, error: 'Database unavailable' }, 503);
  }

  const baseURL = c.env.API_BASE_URL || new URL(c.req.url).origin;
  const auth = createAuth(d1, c.env.BETTER_AUTH_SECRET, baseURL);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing session' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);
  return next();
});

/**
 * Role-Based Access Control Guard
 * Ensures authenticated user has one of the allowed roles (e.g. ['Admin'])
 */
export function requireRole(allowedRoles: string[]) {
  return createMiddleware<Env>(async (c, next) => {
    const d1 = resolveD1(c.env);
    if (!d1) {
      return c.json({ success: false, error: 'Database unavailable' }, 503);
    }

    const baseURL = c.env.API_BASE_URL || new URL(c.req.url).origin;
    const auth = createAuth(d1, c.env.BETTER_AUTH_SECRET, baseURL);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ success: false, error: 'Unauthorized: Authentication required' }, 401);
    }

    c.set('user', session.user);
    c.set('session', session.session);

    const userRole = ((session.user as any).role || 'user').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // Owner and Admin both have full master account access
    const isMaster = userRole === 'owner' || userRole === 'admin';
    const allowsMaster = normalizedAllowed.includes('admin') || normalizedAllowed.includes('owner');

    const hasPermission = (isMaster && allowsMaster) || normalizedAllowed.includes(userRole);
    if (!hasPermission) {
      return c.json(
        { success: false, error: `Forbidden: Requires ${allowedRoles.join(' or ')} privileges` },
        403
      );
    }

    return next();
  });
}

/**
 * Optional Authentication Middleware
 * Attaches user/session if present, otherwise proceeds anonymously.
 */
export const optionalAuth = createMiddleware<Env>(async (c, next) => {
  const d1 = resolveD1(c.env);
  if (d1) {
    try {
      const baseURL = c.env.API_BASE_URL || new URL(c.req.url).origin;
      const auth = createAuth(d1, c.env.BETTER_AUTH_SECRET, baseURL);
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      if (session?.user) {
        c.set('user', session.user);
        c.set('session', session.session);
      }
    } catch {
      // Proceed without authenticated user
    }
  }
  return next();
});

export const sessionMiddleware = requireAuth;
export const authMiddleware = requireAuth;
export const optionalAuthMiddleware = optionalAuth;
