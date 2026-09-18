import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../db';
import * as schema from '../db/schema';

export function createAuth(d1: D1Database, secret?: string, baseURL?: string) {
  const db = getDb(d1);
  const authSecret =
    secret ||
    (typeof process !== 'undefined' ? process.env?.BETTER_AUTH_SECRET : undefined) ||
    'astu-express-better-auth-secure-secret-2026-key-prod';

  const effectiveBaseURL =
    baseURL ||
    (typeof process !== 'undefined' ? process.env?.API_BASE_URL : undefined) ||
    'http://localhost:8787';

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    baseURL: effectiveBaseURL,
    secret: authSecret || 'astu-express-dev-fallback-secret-key-32-chars-local',
    plugins: [
      admin({
        defaultRole: 'user',
        roles: {
          admin: {},
          Admin: {},
          owner: {},
          Owner: {},
          manager: {},
          Manager: {},
          operator: {},
          Operator: {},
        } as any,
        adminRole: ['admin', 'Admin', 'owner', 'Owner', 'manager', 'Manager'],
      }),
      bearer(),
    ],
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        status: {
          type: 'string',
          required: false,
          defaultValue: 'Active',
          input: true,
        },
        phone: {
          type: 'string',
          required: false,
          input: true,
        },
        department: {
          type: 'string',
          required: false,
          defaultValue: 'staff',
          input: true,
        },
      },
    },
    trustedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8787',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8787',
      'https://*.workers.dev',
      'https://*.pages.dev',
      'astuexpress://',
      'astuexpress://*',
      'myapp://',
      'myapp://*',
      'exp://',
      'exp://**',
      'exp://192.168.*.*:*/**',
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
