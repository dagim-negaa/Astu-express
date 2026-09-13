import { Hono } from 'hono';
import { requireAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { SupplierService } from '../modules/suppliers/suppliers.service';

export const suppliersRouter = new Hono<Env>();

suppliersRouter.use('*', requireAuth);

suppliersRouter.get('/', async (c) => {
  const service = new SupplierService(resolveD1(c.env));
  const suppliers = await service.list();
  return c.json({ success: true, data: suppliers });
});

suppliersRouter.get('/:id', async (c) => {
  const service = new SupplierService(resolveD1(c.env));
  const supplier = await service.getById(c.req.param('id'));
  return c.json({ success: true, data: supplier });
});

suppliersRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new SupplierService(resolveD1(c.env));
  const supplier = await service.create(body);
  return c.json({ success: true, data: supplier }, 201);
});

suppliersRouter.patch('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new SupplierService(resolveD1(c.env));
  const supplier = await service.update(c.req.param('id'), body);
  return c.json({ success: true, data: supplier });
});

suppliersRouter.delete('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  const service = new SupplierService(resolveD1(c.env));
  await service.delete(c.req.param('id'));
  return c.json({ success: true, message: 'Supplier deleted' });
});
