import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useAdminStore, type AdminCustomer } from '../../store/AdminStore';
import { Drawer } from '../../components/ui/Drawer';
import { Users, Eye, Search } from 'lucide-react';

export const Route = createFileRoute('/admin/customers')({
  component: CustomersComponent,
});

function CustomersComponent() {
  const { customers, orders } = useAdminStore();
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Customer Management
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            R2 Express — Manage registered clientele, measure lifetime spend, and view order histories.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={14} color="#0ea5e9" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search customer by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem 0.45rem 2rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
            }}
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Registered Customers ({filteredCustomers.length})</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear Search
            </button>
          )}
        </div>

        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '3rem 1.25rem', textAlign: 'center', color: '#64748b' }}>
            <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4, color: '#0ea5e9' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
              {customers.length === 0 ? 'No customer profiles registered yet.' : 'No customers match your search.'}
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem' }}>
              Customer records are automatically synchronized when R2 Express orders are placed.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Customer Name</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Email Address</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Phone</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Date Joined</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>Orders</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Total Spent (ETB)</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{c.email}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{c.phone}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{c.createdAt}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{c.ordersCount}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>ETB {c.totalSpentEtb.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        style={{ padding: '0.35rem 0.55rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        title="View Customer Profile"
                      >
                        <Eye size={15} color="#0f172a" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Drawer */}
      <Drawer isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Profile Details">
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>{selectedCustomer.name}</h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8125rem', color: '#334155' }}>{selectedCustomer.email}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8125rem', color: '#334155' }}>Phone: {selectedCustomer.phone}</p>
              <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.725rem', color: '#64748b' }}>
                Customer since: {selectedCustomer.createdAt}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lifetime Orders</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                  {selectedCustomer.ordersCount}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Spent</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '0.15rem' }}>
                  ETB {selectedCustomer.totalSpentEtb.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Past Orders by this customer */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                Recent Purchases
              </span>
              {orders.filter((o) => o.customerEmail === selectedCustomer.email).length === 0 ? (
                <p style={{ fontSize: '0.78125rem', color: '#64748b', margin: 0 }}>No orders recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {orders
                    .filter((o) => o.customerEmail === selectedCustomer.email)
                    .map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          padding: '0.55rem 0.75rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                            #{ord.id} - {ord.garmentTitle}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{ord.createdAt}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                          ETB {ord.totalPriceEtb.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
