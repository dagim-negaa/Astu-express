import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const Route = createFileRoute('/admin/suppliers')({
  component: SuppliersComponent,
});

function SuppliersComponent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: 'Ethiopia', paymentTerms: 'Net 30', notes: '' });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const result = await apiClient.listSuppliers();
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.createSupplier(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiClient.updateSupplier(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const resetForm = () => setForm({ name: '', email: '', phone: '', address: '', city: '', country: 'Ethiopia', paymentTerms: 'Net 30', notes: '' });

  const filtered = suppliers.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Supplier & Procurement Management
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            R2 Express — Manage verified Ethiopian garment, fabric & logistics vendors.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 0.95rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
        >
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px' }}>
        <Search size={14} color="#64748b" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Truck size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No suppliers found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Name</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Contact</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Location</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Payment Terms</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      <div>{s.email || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{s.city || '—'}, {s.country}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{s.paymentTerms}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.status === 'active' ? '#16a34a' : '#dc2626', backgroundColor: s.status === 'active' ? '#f0fdf4' : '#fef2f2', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => { setEditSupplier(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', country: s.country || 'Ethiopia', paymentTerms: s.paymentTerms || 'Net 30', notes: s.notes || '' }); }} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0.25rem' }}><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('Delete this supplier?')) deleteMutation.mutate(s.id); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isAddModalOpen || !!editSupplier} onClose={() => { setIsAddModalOpen(false); setEditSupplier(null); }} title={editSupplier ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={(e) => { e.preventDefault(); if (editSupplier) { updateMutation.mutate({ id: editSupplier.id, data: form }); } else { createMutation.mutate(form); } }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {['name', 'email', 'phone', 'address', 'city'].map((field) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{field}{field === 'name' ? ' *' : ''}</label>
              <input type={field === 'email' ? 'email' : 'text'} required={field === 'name'} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Payment Terms</label>
            <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              <option>Net 30</option>
              <option>Net 60</option>
              <option>COD</option>
              <option>Prepaid</option>
            </select>
          </div>
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.625rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            {editSupplier ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
