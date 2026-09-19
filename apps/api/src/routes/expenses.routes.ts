import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { ExpenseService } from '../modules/expenses/expenses.service';

export const expensesRouter = new Hono<Env>();

expensesRouter.get('/', optionalAuth, async (c) => {
  const category = c.req.query('category');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const service = new ExpenseService(resolveD1(c.env));
  const expenses = await service.list({ category: category || undefined, startDate, endDate });
  return c.json({ success: true, data: expenses });
});

expensesRouter.get('/summary', optionalAuth, async (c) => {
  const service = new ExpenseService(resolveD1(c.env));
  const summary = await service.getSummary();
  return c.json({ success: true, data: summary });
});

expensesRouter.post('/', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new ExpenseService(resolveD1(c.env));
  const expense = await service.create(body);
  return c.json({ success: true, data: expense }, 201);
});

expensesRouter.delete('/:id', requireRole(['owner', 'Owner', 'admin', 'Admin']), async (c) => {
  const service = new ExpenseService(resolveD1(c.env));
  await service.delete(c.req.param('id'));
  return c.json({ success: true, message: 'Expense deleted' });
});
