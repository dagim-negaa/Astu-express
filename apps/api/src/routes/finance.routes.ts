import { Hono } from 'hono';
import { optionalAuth, requireRole, resolveD1, type Env } from '../middleware/auth';
import { FinanceService } from '../modules/finance/finance.service';

export const financeRouter = new Hono<Env>();

// 1. Dashboard & Reports
financeRouter.get('/dashboard', optionalAuth, async (c) => {
  const service = new FinanceService(resolveD1(c.env));
  const dashboard = await service.getDashboard();
  return c.json({ success: true, data: dashboard });
});

financeRouter.get('/profit-loss', optionalAuth, async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const service = new FinanceService(resolveD1(c.env));
  const report = await service.getProfitLoss(startDate || undefined, endDate || undefined);
  return c.json({ success: true, data: report });
});

// 2. Bank Accounts
financeRouter.get('/accounts', optionalAuth, async (c) => {
  const service = new FinanceService(resolveD1(c.env));
  const accounts = await service.listAccounts();
  return c.json({ success: true, data: accounts });
});

financeRouter.post('/accounts', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new FinanceService(resolveD1(c.env));
  const account = await service.createAccount(body);
  return c.json({ success: true, data: account }, 201);
});

financeRouter.post('/accounts/:id/deposit', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const accountId = c.req.param('id');
  const service = new FinanceService(resolveD1(c.env));
  const txn = await service.deposit({
    accountId,
    amountEtb: Number(body.amountEtb),
    description: body.description,
    category: body.category,
    date: body.date,
  });
  return c.json({ success: true, data: txn });
});

financeRouter.post('/transfer', requireRole(['owner', 'Owner', 'admin', 'Admin', 'manager', 'Manager']), async (c) => {
  const body = await c.req.json();
  const service = new FinanceService(resolveD1(c.env));
  const result = await service.transfer({
    fromAccountId: body.fromAccountId,
    toAccountId: body.toAccountId,
    amountEtb: Number(body.amountEtb),
    description: body.description,
    date: body.date,
  });
  return c.json({ success: true, data: result });
});

// 3. Transactions Ledger
financeRouter.get('/transactions', optionalAuth, async (c) => {
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 100;
  const service = new FinanceService(resolveD1(c.env));
  const txns = await service.listTransactions(limit);
  return c.json({ success: true, data: txns });
});
