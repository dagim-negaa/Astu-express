import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Landmark,
  ArrowUpRight,
  Printer,
  Calendar,
  FileSpreadsheet,
  PieChart,
  RefreshCw,
} from 'lucide-react';

export const Route = createFileRoute('/admin/reports')({
  component: ReportsComponent,
});

export function ReportsComponent() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'overview' | 'expenses'>('pnl');
  const [period, setPeriod] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Calculate date range based on selected period
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    if (period === 'month') {
      return { startDate: `${year}-${month}-01`, endDate: `${year}-${month}-${day}` };
    }
    if (period === 'quarter') {
      const qStartMonth = String(Math.floor(now.getMonth() / 3) * 3 + 1).padStart(2, '0');
      return { startDate: `${year}-${qStartMonth}-01`, endDate: `${year}-${month}-${day}` };
    }
    if (period === 'year') {
      return { startDate: `${year}-01-01`, endDate: `${year}-${month}-${day}` };
    }
    if (period === 'custom') {
      return { startDate: customStart || undefined, endDate: customEnd || undefined };
    }
    return { startDate: undefined, endDate: undefined };
  }, [period, customStart, customEnd]);

  // 1. Fetch Profit & Loss Report for selected timeframe
  const { data: profitLoss, isLoading: isLoadingPnL, refetch: refetchPnL } = useQuery({
    queryKey: ['profitLossReport', startDate, endDate],
    queryFn: async () => {
      const result = await apiClient.getProfitLoss(startDate, endDate);
      return result.data;
    },
  });

  // 2. Fetch General Finance Dashboard metrics
  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ['financeDashboard'],
    queryFn: async () => {
      const result = await apiClient.getFinanceDashboard();
      return result.data;
    },
  });

  const isLoading = isLoadingPnL || isLoadingDashboard;

  // 3. Fetch Live Bank Accounts & Capital Liquidity
  const { data: rawAccounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const result = await apiClient.listBankAccounts();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });

  const accounts = Array.isArray(rawAccounts) ? rawAccounts : [];
  const totalLiquidity = accounts.reduce((sum: number, a: any) => sum + (Number(a.currentBalance) || 0), 0);

  // Safe fallback metrics
  const revenue = Number(profitLoss?.revenue ?? dashboard?.totalRevenue ?? 0);
  const cogs = Number(profitLoss?.costOfGoodsSold ?? dashboard?.costOfGoodsSold ?? 0);
  const grossProfit = Number(profitLoss?.grossProfit ?? dashboard?.grossProfit ?? revenue - cogs);
  const totalExpenses = Number(profitLoss?.totalExpenses ?? dashboard?.totalExpenses ?? 0);
  const netProfit = Number(profitLoss?.netProfit ?? dashboard?.netProfit ?? grossProfit - totalExpenses);
  const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
  const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;
  const expenseList = Array.isArray(profitLoss?.expenses)
    ? profitLoss.expenses
    : Array.isArray(dashboard?.expensesByCategory)
      ? dashboard.expensesByCategory
      : [];

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    refetchPnL();
    refetchDashboard();
    refetchAccounts();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Financial Intelligence & Profit and Loss (P&L)
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            ASTU Express Ethiopian Business System — Authoritative Income Statement, Operating Cost Breakdown & Capital Liquidity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#ffffff',
              color: '#475569',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> {isLoading ? 'Updating...' : 'Refresh'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print Statement
          </button>

          <Link
            to="/admin/finance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.5rem 0.95rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}
          >
            <Landmark size={15} /> Treasury & Bank Accounts <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Navigation Tabs & Period Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('pnl')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'pnl' ? '#0f172a' : 'transparent',
              color: activeTab === 'pnl' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={14} /> Profit & Loss Statement
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'overview' ? '#0f172a' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <BarChart3 size={14} /> Executive KPI Overview
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'expenses' ? '#0f172a' : 'transparent',
              color: activeTab === 'expenses' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <PieChart size={14} /> Expense Breakdown
          </button>
        </div>

        {/* Time Period Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} /> Period:
          </span>
          {(['all', 'month', 'quarter', 'year', 'custom'] as const).map((p) => {
            const labels: Record<string, string> = {
              all: 'All Time',
              month: 'This Month',
              quarter: 'This Quarter',
              year: 'YTD 2026',
              custom: 'Custom',
            };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '0.25rem',
                  border: period === p ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: period === p ? '#eff6ff' : '#ffffff',
                  color: period === p ? '#0284c7' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {labels[p]}
              </button>
            );
          })}

          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.25rem' }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Liquidity Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Working Capital Liquidity (All Accounts)
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, fontFamily: 'Hanken Grotesk, sans-serif', color: '#0f172a', marginTop: '0.2rem' }}>
              ETB {totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.25rem 0.65rem', borderRadius: '0.375rem', fontWeight: 700 }}>
            ● {accounts.length} Accounts Reconciled
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          {accounts.map((a: any) => (
            <div key={a.id} style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.625rem', borderRadius: '0.375rem' }}>
              <div style={{ color: '#64748b', fontWeight: 600 }}>{a.accountName}</div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                ETB {(Number(a.currentBalance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TAB 1: PROFIT & LOSS STATEMENT */}
      {activeTab === 'pnl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Executive P&L Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>1. Gross Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                ETB {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>Delivered & paid customer orders</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #ea580c' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>2. Cost of Goods Sold (COGS)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c', marginTop: '0.25rem' }}>
                ETB {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>Direct garment & fabric buying cost</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>3. Gross Profit (Revenue - COGS)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
                ETB {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#0284c7', fontWeight: 700, marginTop: '0.25rem' }}>
                Gross Margin: {grossMargin}%
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>4. Total Operating Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                ETB {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>Rent, utilities, logistics & salaries</div>
            </div>

            <div
              style={{
                backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
                padding: '1.125rem 1.25rem',
                borderRadius: '0.5rem',
                border: netProfit >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
                borderLeft: netProfit >= 0 ? '4px solid #16a34a' : '4px solid #dc2626',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: netProfit >= 0 ? '#166534' : '#991b1b', fontWeight: 700 }}>
                5. Net Profit / (Loss)
              </div>
              <div
                style={{
                  fontSize: '1.625rem',
                  fontWeight: 900,
                  color: netProfit >= 0 ? '#16a34a' : '#dc2626',
                  marginTop: '0.25rem',
                }}
              >
                ETB {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: netProfit >= 0 ? '#15803d' : '#b91c1c',
                  marginTop: '0.25rem',
                }}
              >
                Net Margin: {netMargin}%
              </div>
            </div>
          </div>

          {/* Standard Accounting Waterfall Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.625rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Statement of Profit and Loss (Income Statement)
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Reporting Period: <strong style={{ color: '#0f172a' }}>{profitLoss?.period || 'All Historical Records'}</strong> • Currency: ETB
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: '0.25rem', backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.75rem' }}>
                {netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {netProfit >= 0 ? `NET PROFITABLE (+${netMargin}%)` : `NET DEFICIT (${netMargin}%)`}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.65rem 1.25rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Accounting Line Item</th>
                    <th style={{ padding: '0.65rem 1.25rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Subtotal (ETB)</th>
                    <th style={{ padding: '0.65rem 1.25rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Amount (ETB)</th>
                    <th style={{ padding: '0.65rem 1.25rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>% of Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Section A: REVENUE */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>
                    <td colSpan={4} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#0369a1' }}>
                      1. OPERATING REVENUE (INCOME)
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 1.25rem 0.625rem 2rem', color: '#334155' }}>
                      Gross Retail Garment & Bespoke Sales
                    </td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                      ETB {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>—</td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>100.0%</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#fafafa', fontWeight: 700 }}>
                    <td style={{ padding: '0.65rem 1.25rem', color: '#0f172a' }}>TOTAL OPERATING REVENUE (A)</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                      ETB {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#16a34a' }}>100.0%</td>
                  </tr>

                  {/* Section B: COGS */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>
                    <td colSpan={4} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#ea580c' }}>
                      2. COST OF GOODS SOLD (COGS)
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 1.25rem 0.625rem 2rem', color: '#334155' }}>
                      Garment Procurement & Direct Sourcing
                    </td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                      ETB {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>—</td>
                    <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                      {revenue > 0 ? Math.round((cogs / revenue) * 100) : 0}%
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#fafafa', fontWeight: 700 }}>
                    <td style={{ padding: '0.65rem 1.25rem', color: '#0f172a' }}>TOTAL COST OF GOODS SOLD (B)</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#ea580c', fontWeight: 800 }}>
                      ETB {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#ea580c' }}>
                      {revenue > 0 ? Math.round((cogs / revenue) * 100) : 0}%
                    </td>
                  </tr>

                  {/* Section C: GROSS PROFIT */}
                  <tr style={{ backgroundColor: '#e0f2fe', borderTop: '2px solid #0284c7', borderBottom: '2px solid #0284c7', fontWeight: 900 }}>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#0369a1', fontSize: '0.875rem' }}>
                      3. GROSS PROFIT (A - B)
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: '#0369a1', fontSize: '0.9375rem' }}>
                      ETB {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: '#0369a1', fontSize: '0.875rem' }}>
                      {grossMargin}%
                    </td>
                  </tr>

                  {/* Section D: OPERATING EXPENSES */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>
                    <td colSpan={4} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#dc2626' }}>
                      4. OPERATING EXPENDITURES (OPEX)
                    </td>
                  </tr>
                  {expenseList.length === 0 ? (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td colSpan={4} style={{ padding: '1rem 1.25rem', textAlign: 'center', color: '#94a3b8' }}>
                        No operating expenses recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    expenseList.map((cat: any) => (
                      <tr key={cat.category} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.625rem 1.25rem 0.625rem 2rem', color: '#334155' }}>
                          {cat.label || cat.category}
                        </td>
                        <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                          ETB {Number(cat.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>—</td>
                        <td style={{ padding: '0.625rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                          {revenue > 0 ? ((Number(cat.total) / revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                  <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#fafafa', fontWeight: 700 }}>
                    <td style={{ padding: '0.65rem 1.25rem', color: '#0f172a' }}>TOTAL OPERATING EXPENDITURES (D)</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>
                      ETB {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.65rem 1.25rem', textAlign: 'right', color: '#dc2626' }}>
                      {revenue > 0 ? Math.round((totalExpenses / revenue) * 100) : 0}%
                    </td>
                  </tr>

                  {/* Section E: NET PROFIT / LOSS */}
                  <tr
                    style={{
                      backgroundColor: netProfit >= 0 ? '#dcfce7' : '#fee2e2',
                      borderTop: netProfit >= 0 ? '3px solid #16a34a' : '3px solid #dc2626',
                      borderBottom: netProfit >= 0 ? '3px solid #16a34a' : '3px solid #dc2626',
                      fontWeight: 900,
                    }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', color: netProfit >= 0 ? '#14532d' : '#7f1d1d', fontSize: '0.9375rem' }}>
                      5. NET PROFIT / (NET LOSS) (C - D)
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>—</td>
                    <td
                      style={{
                        padding: '0.85rem 1.25rem',
                        textAlign: 'right',
                        color: netProfit >= 0 ? '#16a34a' : '#dc2626',
                        fontSize: '1.125rem',
                      }}
                    >
                      ETB {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 1.25rem',
                        textAlign: 'right',
                        color: netProfit >= 0 ? '#15803d' : '#b91c1c',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {netMargin}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTIVE KPI OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                    ETB {revenue.toLocaleString()}
                  </div>
                </div>
                <DollarSign size={24} color="#16a34a" />
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Expenses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                    ETB {totalExpenses.toLocaleString()}
                  </div>
                </div>
                <Receipt size={24} color="#dc2626" />
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Net Profit</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: '0.25rem' }}>
                    ETB {netProfit.toLocaleString()}
                  </div>
                </div>
                {netProfit >= 0 ? <TrendingUp size={24} color="#16a34a" /> : <TrendingDown size={24} color="#dc2626" />}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profit Margin</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {netMargin}%
                  </div>
                </div>
                <BarChart3 size={24} color="#8b5cf6" />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Cost of Goods Sold (COGS)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                ETB {cogs.toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Profit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                ETB {grossProfit.toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Order Volume</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                {dashboard?.orderCount || 0}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Average Order Value</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                ETB {Number(dashboard?.averageOrderValue || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE BREAKDOWN */}
      {activeTab === 'expenses' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a' }}>
            Expense Breakdown by Category ({expenseList.length} Categories)
          </div>
          <div style={{ padding: '1.25rem' }}>
            {expenseList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No expenses logged for this period. Add expenses from the Expenses tab.
              </div>
            ) : (
              expenseList.map((cat: any) => (
                <div key={cat.category} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                      {cat.label || cat.category}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      ETB {Number(cat.total || 0).toLocaleString()} ({cat.percentage}%) • {cat.count} records
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        backgroundColor: '#dc2626',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
