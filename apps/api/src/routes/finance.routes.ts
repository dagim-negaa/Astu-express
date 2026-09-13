import { Hono } from 'hono';
import { requireAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { FinanceService } from '../modules/finance/finance.service';

export const financeRouter = new Hono<Env>();

financeRouter.use('*', requireAuth);

financeRouter.get('/dashboard', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  const service = new FinanceService(resolveD1(c.env));
  const dashboard = await service.getDashboard();
  return c.json({ success: true, data: dashboard });
});

financeRouter.get('/profit-loss', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const service = new FinanceService(resolveD1(c.env));
  const report = await service.getProfitLoss(startDate || undefined, endDate || undefined);
  return c.json({ success: true, data: report });
});
