import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { ShipmentService } from '../modules/shipments/shipments.service';

export const shipmentsRouter = new Hono<Env>();

shipmentsRouter.get('/', optionalAuth, async (c) => {
  const service = new ShipmentService(resolveD1(c.env));
  const shipments = await service.list();
  return c.json({ success: true, data: shipments });
});

shipmentsRouter.get('/:id', optionalAuth, async (c) => {
  const service = new ShipmentService(resolveD1(c.env));
  const shipment = await service.getById(c.req.param('id'));
  return c.json({ success: true, data: shipment });
});

shipmentsRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new ShipmentService(resolveD1(c.env));
  const shipment = await service.create(body);
  return c.json({ success: true, data: shipment }, 201);
});

shipmentsRouter.patch('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager', 'staff', 'Staff']), async (c) => {
  const body = await c.req.json();
  const service = new ShipmentService(resolveD1(c.env));
  const shipment = await service.update(c.req.param('id'), body);
  return c.json({ success: true, data: shipment });
});
