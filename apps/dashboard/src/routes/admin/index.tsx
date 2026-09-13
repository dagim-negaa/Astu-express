import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useAdminStore, calculateStockHealth } from '../../store/AdminStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: OverviewComponent,
});

function OverviewComponent() {
  const { products, orders, getActiveStoreRevenue, activeStore } = useAdminStore();

  const totalRevenueEtb = getActiveStoreRevenue(orders);
  const lowStockProducts = products.filter((p) => calculateStockHealth(p.stockQuantity, p.initialStock).isLow);
  const recentOrders = orders.slice(0, 5);

  const weeklyRevenue = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentWeekOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return !isNaN(d.getTime()) && d >= startOfWeek;
    });

    const targetOrders = currentWeekOrders.length > 0 ? currentWeekOrders : orders;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    targetOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (!isNaN(d.getTime())) {
        const name = dayNames[d.getDay()];
        if (dayMap[name] !== undefined) {
          dayMap[name] += getActiveStoreRevenue([o]);
        }
      }
    });

    const data = dayLabels.map((day) => ({
      day,
      val: dayMap[day] || 0,
    }));

    const maxVal = Math.max(...data.map((d) => d.val), 1);
    return data.map((d) => ({
      ...d,
      heightPercent: Math.round((d.val / maxVal) * 100),
    }));
  }, [orders, getActiveStoreRevenue]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Hanken Grotesk, sans-serif' }}>
            R2 Express Mini ERP Overview
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Operations & Logistics monitoring for <strong style={{ color: '#0284c7' }}>{activeStore.name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/"
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.375rem',
              color: '#0284c7',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Preview Customer Shop &rarr;
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Total Gross Revenue"
          value={`ETB ${totalRevenueEtb.toLocaleString()}`}
          trend={{ value: '+14.2% vs last month', isPositive: true }}
          icon={DollarSign}
        />
        <StatCard
          title="Total Customer Orders"
          value={orders.length.toString()}
          trend={{ value: `${orders.filter((o) => o.status === 'delivered').length} completed`, isPositive: true }}
          icon={ShoppingBag}
        />
        <StatCard
          title="Active Catalog SKUs"
          value={products.length.toString()}
          subtitle="In Ethiopian inventory"
          icon={Package}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockProducts.length.toString()}
          trend={{ value: lowStockProducts.length > 0 ? 'Replenishment needed' : 'Optimal', isPositive: lowStockProducts.length === 0 }}
          icon={AlertTriangle}
          accentColor={lowStockProducts.length > 0 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* Charts & Quick Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Weekly Revenue Bar Chart */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Weekly Sales Velocity (ETB)
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Current Period</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingBottom: '0.5rem' }}>
            {weeklyRevenue.map((bar) => (
              <div key={bar.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                <div
                  title={`ETB ${bar.val.toLocaleString()}`}
                  style={{
                    width: '60%',
                    height: `${Math.max(bar.heightPercent, 8)}%`,
                    backgroundColor: bar.val > 0 ? '#0284c7' : '#e2e8f0',
                    borderRadius: '0.25rem 0.25rem 0 0',
                    transition: 'height 0.3s ease',
                  }}
                />
                <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert Summary Card */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.125rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Low Stock Warnings
            </h3>
            <Link to="/admin/inventory" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              View Inventory &rarr;
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
              All R2 Express inventory levels are healthy.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lowStockProducts.slice(0, 3).map((p) => {
                const health = calculateStockHealth(p.stockQuantity, p.initialStock);
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#fdf4f2', borderRadius: '0.375rem', border: '1px solid #fecdd3' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{p.title}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {p.sku} | {p.color} / {p.size} &bull; {health.unitsSold} sold
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b3224', display: 'block' }}>
                        {p.stockQuantity} left ({health.percentage}%)
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        of {health.initialStock} batch
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Grid */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            Recent Customer Orders
          </h3>
          <Link to="/admin/orders" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
            Manage All Orders &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
            No customer orders placed yet. Orders submitted from the storefront will automatically appear here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9375rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Order ID</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Item</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Total Price</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Payment</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>#{o.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{o.customerName}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{o.garmentTitle} (x{o.quantity})</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>ETB {o.totalPriceEtb.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.18rem 0.45rem', borderRadius: '0.25rem' }}>
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
