import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ShoppingCart, Plus, Eye, CheckCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/StatusPill';

export const Route = createFileRoute('/admin/purchases')({
  component: PurchasesComponent,
});

function PurchasesComponent() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<any>(null);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const result = await apiClient.listPurchases();
      return result.data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const result = await apiClient.listSuppliers();
      return result.data || [];
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.receivePurchase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  const [form, setForm] = useState({
    supplierId: '',
    notes: '',
    expectedDeliveryDate: '',
    items: [{ description: '', quantity: 1, unitCostEtb: 0 }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.createPurchase(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setIsAddModalOpen(false);
      setForm({ supplierId: '', notes: '', expectedDeliveryDate: '', items: [{ description: '', quantity: 1, unitCostEtb: 0 }] });
    },
  });

  const totalAmount = form.items.reduce((sum, i) => sum + i.quantity * i.unitCostEtb, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Purchase Orders & Procurement
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            R2 Express — Manage vendor orders, track procurement costs, and receive stock.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 0.95rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
          <Plus size={15} /> New Purchase Order
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : purchases.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No purchase orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Order ID</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Supplier</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Items</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Total</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((po: any) => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>#{po.id.slice(0, 12)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{suppliers.find((s: any) => s.id === po.supplierId)?.name || po.supplierId}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{po.items?.length || 0} items</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>ETB {po.totalAmountEtb?.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusPill status={po.status} /></td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => setViewPurchase(po)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}><Eye size={15} /></button>
                      {po.status === 'submitted' && (
                        <button onClick={() => receiveMutation.mutate(po.id)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', marginLeft: '0.5rem' }} title="Mark as Received"><CheckCircle size={15} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Purchase Order">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Supplier *</label>
            <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Expected Delivery</label>
            <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Items</label>
              <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitCostEtb: 0 }] })} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>+ Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input placeholder="Description" required value={item.description} onChange={(e) => { const items = [...form.items]; items[i].description = e.target.value; setForm({ ...form, items }); }} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
                <input type="number" placeholder="Qty" required min="1" value={item.quantity} onChange={(e) => { const items = [...form.items]; items[i].quantity = Number(e.target.value); setForm({ ...form, items }); }} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
                <input type="number" placeholder="Unit Cost" required min="0" value={item.unitCostEtb || ''} onChange={(e) => { const items = [...form.items]; items[i].unitCostEtb = Number(e.target.value); setForm({ ...form, items }); }} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
                {form.items.length > 1 && <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>}
              </div>
            ))}
            <div style={{ textAlign: 'right', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Total: ETB {totalAmount.toLocaleString()}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
          </div>

          <button type="submit" disabled={createMutation.isPending || !form.supplierId} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.625rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </form>
      </Modal>

      {viewPurchase && (
        <Modal isOpen={!!viewPurchase} onClose={() => setViewPurchase(null)} title={`Purchase Order #${viewPurchase.id.slice(0, 12)}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div><strong>Supplier:</strong> {suppliers.find((s: any) => s.id === viewPurchase.supplierId)?.name || viewPurchase.supplierId}</div>
            <div><strong>Status:</strong> {viewPurchase.status}</div>
            <div><strong>Total:</strong> ETB {viewPurchase.totalAmountEtb?.toLocaleString()}</div>
            <div><strong>Created:</strong> {new Date(viewPurchase.createdAt).toLocaleString()}</div>
            {viewPurchase.notes && <div><strong>Notes:</strong> {viewPurchase.notes}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
