import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const EXPENSE_CATEGORIES = [
  { value: 'shipping', label: 'Shipping & Logistics' },
  { value: 'warehouse', label: 'Warehouse & Storage' },
  { value: 'rent', label: 'Rent & Lease' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries & Wages' },
  { value: 'packaging', label: 'Packaging Materials' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'supplies', label: 'Office Supplies' },
  { value: 'maintenance', label: 'Maintenance & Repairs' },
  { value: 'other', label: 'Other Expenses' },
];

export const Route = createFileRoute('/admin/expenses')({
  component: ExpensesComponent,
});

function ExpensesComponent() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({ category: 'shipping', description: '', amountEtb: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', reference: '' });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: async () => {
      const result = await apiClient.listExpenses({ category: categoryFilter || undefined });
      return result.data || [];
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['expenseSummary'],
    queryFn: async () => {
      const result = await apiClient.getExpenseSummary();
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiClient.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
      setIsAddModalOpen(false);
      setForm({ category: 'shipping', description: '', amountEtb: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', reference: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Operational Expenses Tracking
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            R2 Express — Track warehouse overhead, cargo courier costs, packaging and administrative expenditures.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 0.95rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Recorded Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>ETB {summary.totalExpenses?.toLocaleString()}</div>
          </div>
          {summary.byCategory?.slice(0, 3).map((cat: any) => (
            <div key={cat.category} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{EXPENSE_CATEGORIES.find((c) => c.value === cat.category)?.label || cat.category}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>ETB {cat.total?.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cat.count} entries</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setCategoryFilter('')} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: !categoryFilter ? '#0284c7' : '#ffffff', color: !categoryFilter ? '#ffffff' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>All</button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setCategoryFilter(cat.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: categoryFilter === cat.value ? '#0284c7' : '#ffffff', color: categoryFilter === cat.value ? '#ffffff' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{cat.label}</button>
        ))}
      </div>

      {/* Expenses Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Receipt size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No expenses recorded</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Payment</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>{e.date}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>{e.category}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{e.description}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#dc2626' }}>ETB {e.amountEtb.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', color: '#64748b' }}>{e.paymentMethod}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => { if (confirm('Delete this expense?')) deleteMutation.mutate(e.id); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Expense">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category *</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Description *</label>
            <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Amount (ETB) *</label>
              <input type="number" required min="0" value={form.amountEtb || ''} onChange={(e) => setForm({ ...form, amountEtb: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}>
              <option value="cash">Cash on Hand</option>
              <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
              <option value="telebirr">Telebirr Merchant</option>
            </select>
          </div>
          <button type="submit" disabled={createMutation.isPending} style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.625rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            {createMutation.isPending ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
