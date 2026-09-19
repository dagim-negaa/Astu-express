import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { SupplierService } from '../modules/suppliers/suppliers.service';

export const suppliersRouter = new Hono<Env>();

suppliersRouter.get('/', optionalAuth, async (c) => {
  const service = new SupplierService(resolveD1(c.env));
  const suppliers = await service.list();
  return c.json({ success: true, data: suppliers });
});

suppliersRouter.get('/:id', optionalAuth, async (c) => {
  const service = new SupplierService(resolveD1(c.env));
  const supplier = await service.getById(c.req.param('id'));
  return c.json({ success: true, data: supplier });
});

suppliersRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  try {
    const body = await c.req.json();
    if (!body?.name?.trim()) {
      return c.json({ success: false, error: 'Supplier company/vendor name is required' }, 400);
    }
    const service = new SupplierService(resolveD1(c.env));
    const supplier = await service.create({
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      country: body.country?.trim() || 'Ethiopia',
      paymentTerms: body.paymentTerms?.trim() || 'Net 30',
      status: body.status?.trim() || 'active',
      notes: body.notes?.trim() || null,
    });
    return c.json({ success: true, data: supplier }, 201);
  } catch (err: any) {
    console.error('Error creating supplier:', err);
    return c.json({ success: false, error: err.message || 'Failed to create supplier' }, 400);
  }
});

suppliersRouter.patch('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  try {
    const body = await c.req.json();
    const service = new SupplierService(resolveD1(c.env));
    const supplier = await service.update(c.req.param('id'), body);
    return c.json({ success: true, data: supplier });
  } catch (err: any) {
    console.error('Error updating supplier:', err);
    return c.json({ success: false, error: err.message || 'Failed to update supplier' }, 400);
  }
});

suppliersRouter.delete('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  try {
    const service = new SupplierService(resolveD1(c.env));
    await service.delete(c.req.param('id'));
    return c.json({ success: true, message: 'Supplier deleted' });
  } catch (err: any) {
    console.error('Error deleting supplier:', err);
    return c.json({ success: false, error: err.message || 'Failed to delete supplier' }, 400);
  }
});
