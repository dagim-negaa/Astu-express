import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { PackageCheck, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/StatusPill';

export const Route = createFileRoute('/admin/shipments')({
  component: ShipmentsComponent,
});

function ShipmentsComponent() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ orderId: '', carrier: 'local_courier', shippingAddress: '', shippingCostEtb: 0, estimatedDelivery: '', notes: '' });

  const { data: rawShipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const result = await apiClient.listShipments();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const shipments = Array.isArray(rawShipments) ? rawShipments : [];

  const { data: rawOrders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const result = await apiClient.listOrders();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const orders = Array.isArray(rawOrders) ? rawOrders : [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiClient.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsAddModalOpen(false);
      setForm({ orderId: '', carrier: 'local_courier', shippingAddress: '', shippingCostEtb: 0, estimatedDelivery: '', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiClient.updateShipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
    },
  });

  const filtered = statusFilter ? shipments.filter((s: any) => s.status === statusFilter) : shipments;
  const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>Shipments</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>Track and manage deliveries</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0ea5e9', color: '#ffffff', padding: '0.5rem 0.95rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
          <Plus size={15} /> Create Shipment
        </button>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['', 'pending', 'in_transit', 'delivered'].map((status) => (
          <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: statusFilter === status ? '#0ea5e9' : '#ffffff', color: statusFilter === status ? '#ffffff' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            {status === '' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <PackageCheck size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No shipments found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Order</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Carrier</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Tracking</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Est. Delivery</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sh: any) => (
                  <tr key={sh.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>#{sh.orderId?.slice(0, 12)}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{sh.carrier?.replace('_', ' ')}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{sh.trackingNumber || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusPill status={sh.status} /></td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>{sh.estimatedDelivery || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {sh.status === 'pending' && (
                        <button onClick={() => updateMutation.mutate({ id: sh.id, data: { status: 'in_transit' } })} style={{ backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Ship</button>
                      )}
                      {sh.status === 'in_transit' && (
                        <button onClick={() => updateMutation.mutate({ id: sh.id, data: { status: 'delivered', actualDelivery: new Date().toISOString() } })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Deliver</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Shipment">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Order *</label>
            <select required value={form.orderId} onChange={(e) => { const order = pendingOrders.find((o: any) => o.id === e.target.value); setForm({ ...form, orderId: e.target.value, shippingAddress: order?.shippingAddress || '' }); }} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              <option value="">Select order...</option>
              {pendingOrders.map((o: any) => <option key={o.id} value={o.id}>#{o.id.slice(0, 12)} - {o.customerName} (ETB {o.totalPriceEtb})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Carrier *</label>
            <select value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              <option value="local_courier">Local Courier</option>
              <option value="fedex">FedEx</option>
              <option value="dhl">DHL</option>
              <option value="self_pickup">Self Pickup</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Shipping Address *</label>
            <input type="text" required value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Shipping Cost (ETB)</label>
              <input type="number" min="0" value={form.shippingCostEtb || ''} onChange={(e) => setForm({ ...form, shippingCostEtb: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Est. Delivery</label>
              <input type="date" value={form.estimatedDelivery} onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending || !form.orderId} style={{ backgroundColor: '#0ea5e9', color: '#ffffff', padding: '0.625rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            {createMutation.isPending ? 'Creating...' : 'Create Shipment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
