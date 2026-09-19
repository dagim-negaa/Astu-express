import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { PurchaseService } from '../modules/purchases/purchases.service';

export const purchasesRouter = new Hono<Env>();

purchasesRouter.get('/', optionalAuth, async (c) => {
  const service = new PurchaseService(resolveD1(c.env));
  const purchases = await service.list();
  return c.json({ success: true, data: purchases });
});

purchasesRouter.get('/:id', optionalAuth, async (c) => {
  const service = new PurchaseService(resolveD1(c.env));
  const purchase = await service.getById(c.req.param('id'));
  return c.json({ success: true, data: purchase });
});

purchasesRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new PurchaseService(resolveD1(c.env));
  const purchase = await service.create(body);
  return c.json({ success: true, data: purchase }, 201);
});

purchasesRouter.patch('/:id/status', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const { status } = await c.req.json();
  const service = new PurchaseService(resolveD1(c.env));
  const purchase = await service.updateStatus(c.req.param('id'), status);
  return c.json({ success: true, data: purchase });
});

purchasesRouter.post('/:id/receive', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager', 'staff', 'Staff']), async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    // Optional body
  }
  const service = new PurchaseService(resolveD1(c.env));
  const purchase = await service.receive(c.req.param('id'), body);
  return c.json({ success: true, data: purchase });
});

purchasesRouter.delete('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  const service = new PurchaseService(resolveD1(c.env));
  await service.delete(c.req.param('id'));
  return c.json({ success: true, message: 'Purchase order deleted' });
});
