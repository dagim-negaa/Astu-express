import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';

export const Route = createFileRoute('/admin/reports')({
  component: ReportsComponent,
});

function ReportsComponent() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['financeDashboard'],
    queryFn: async () => {
      const result = await apiClient.getFinanceDashboard();
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>Financial Reports</h1>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading financial data...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>Financial Reports</h1>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No financial data available</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>Financial Reports</h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>R2 Express financial overview and profit analysis</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>ETB {dashboard.totalRevenue?.toLocaleString()}</div>
            </div>
            <DollarSign size={24} color="#16a34a" />
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>ETB {dashboard.totalExpenses?.toLocaleString()}</div>
            </div>
            <Receipt size={24} color="#dc2626" />
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Net Profit</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: dashboard.netProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: '0.25rem' }}>ETB {dashboard.netProfit?.toLocaleString()}</div>
            </div>
            {dashboard.netProfit >= 0 ? <TrendingUp size={24} color="#16a34a" /> : <TrendingDown size={24} color="#dc2626" />}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profit Margin</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{dashboard.profitMargin}%</div>
            </div>
            <BarChart3 size={24} color="#8b5cf6" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Cost of Goods Sold</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>ETB {dashboard.costOfGoodsSold?.toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Profit</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>ETB {dashboard.grossProfit?.toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Orders</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{dashboard.orderCount}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Avg. Order Value</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>ETB {dashboard.averageOrderValue?.toLocaleString()}</div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {dashboard.expensesByCategory?.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a' }}>
            Expense Breakdown by Category
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            {dashboard.expensesByCategory.map((cat: any) => (
              <div key={cat.category} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{cat.label}</span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>ETB {cat.total?.toLocaleString()} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: '#0ea5e9', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
