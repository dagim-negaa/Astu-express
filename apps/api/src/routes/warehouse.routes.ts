import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { WarehouseService } from '../modules/warehouse/warehouse.service';

export const warehouseRouter = new Hono<Env>();

// 1. List all warehouses
warehouseRouter.get('/', optionalAuth, async (c) => {
  const service = new WarehouseService(resolveD1(c.env));
  const data = await service.listWarehouses();
  return c.json({ success: true, data });
});

// 2. Query warehouse inventory items (with warehouse, category, availability filters)
warehouseRouter.get('/items', optionalAuth, async (c) => {
  const service = new WarehouseService(resolveD1(c.env));
  const warehouseId = c.req.query('warehouseId');
  const category = c.req.query('category');
  const availableOnly = c.req.query('availableOnly') !== 'false';
  const search = c.req.query('search');

  const items = await service.listItems({
    warehouseId: warehouseId || undefined,
    category: category || undefined,
    availableOnly,
    search: search || undefined,
  });

  return c.json({ success: true, data: items });
});

// 3. Get single warehouse item
warehouseRouter.get('/items/:id', optionalAuth, async (c) => {
  const service = new WarehouseService(resolveD1(c.env));
  const item = await service.getItemById(c.req.param('id'));
  if (!item) {
    return c.json({ success: false, error: 'Warehouse item not found' }, 404);
  }
  return c.json({ success: true, data: item });
});

// 4. Transfer warehouse item to production / storefront
warehouseRouter.post('/transfer', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  try {
    const body = await c.req.json();
    const service = new WarehouseService(resolveD1(c.env));
    const result = await service.transferToProduction(body);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || 'Failed to transfer warehouse item to production' }, 400);
  }
});

// 5. Create new warehouse hub
warehouseRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  try {
    const body = await c.req.json();
    const service = new WarehouseService(resolveD1(c.env));
    const data = await service.createWarehouse(body);
    return c.json({ success: true, data }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || 'Failed to create warehouse' }, 400);
  }
});

// 6. Get single warehouse by id
warehouseRouter.get('/:id', optionalAuth, async (c) => {
  const service = new WarehouseService(resolveD1(c.env));
  const data = await service.getWarehouseById(c.req.param('id'));
  if (!data) {
    return c.json({ success: false, error: 'Warehouse not found' }, 404);
  }
  return c.json({ success: true, data });
});
