import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ShoppingCart, Plus, Eye, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const Route = createFileRoute('/admin/purchases')({
  component: PurchasesComponent,
});

export function PurchasesComponent() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<any>(null);
  const [grnModalPo, setGrnModalPo] = useState<any>(null);
  const [grnAccountId, setGrnAccountId] = useState('');

  // 1. Fetch Purchase Orders
  const { data: rawPurchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const result = await apiClient.listPurchases();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const purchases = Array.isArray(rawPurchases) ? rawPurchases : [];

  // 2. Fetch Suppliers
  const { data: rawSuppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const result = await apiClient.listSuppliers();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  // 3. Fetch Bank Accounts
  const { data: rawAccounts = [] } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const result = await apiClient.listBankAccounts();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const accounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  // 4. Fetch Warehouses
  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const result = await apiClient.listWarehouses();
      return Array.isArray(result.data) ? result.data : (result.data as any)?.data || [];
    },
  });
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : [];
  const [grnWarehouseId, setGrnWarehouseId] = useState('');

  // Receive (GRN) Mutation
  const receiveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: { accountId?: string; warehouseId?: string; payNow?: boolean } }) => {
      const res = await apiClient.receivePurchase(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to receive purchase order');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setGrnModalPo(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to receive purchase order');
    },
  });

  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    notes: '',
    expectedDeliveryDate: '',
    accountId: '',
    items: [{ description: '', category: 'rtw', quantity: 1, unitCostEtb: 0 }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.createPurchase({
        ...data,
        warehouseId: data.warehouseId || (warehouses[0]?.id || 'wh-main'),
      });
      if (!res.success) throw new Error(res.error || 'Failed to create purchase order');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setIsAddModalOpen(false);
      setForm({
        supplierId: '',
        warehouseId: '',
        notes: '',
        expectedDeliveryDate: '',
        accountId: '',
        items: [{ description: '', category: 'rtw', quantity: 1, unitCostEtb: 0 }],
      });
    },
  });

  const totalAmount = form.items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCostEtb) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Procurement & Purchase Orders (GRN)
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            All system inventory enters exclusively via Goods Received Notes (GRN) into the warehouse.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            if (warehouses.length > 0 && !form.warehouseId) {
              setForm((prev) => ({ ...prev, warehouseId: warehouses[0].id }));
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '0.5rem 0.95rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> New Purchase Order
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading purchase orders...</div>
        ) : purchases.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No purchase orders recorded</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem' }}>Create your first purchase order to order inventory from vendors.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Order ID</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Supplier</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>GRN Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Total (ETB)</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Payment</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((po: any) => {
                  const supplier = suppliers.find((s: any) => s.id === po.supplierId);
                  const isReceived = po.status === 'received';
                  const isPaid = po.paymentStatus === 'paid';
                  return (
                    <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        #{po.id.slice(0, 10)}
                        {po.grnNumber && (
                          <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 700 }}>
                            {po.grnNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{supplier?.name || po.supplierId}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{supplier?.city || 'Vendor'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: isReceived ? '#ecfdf5' : '#fffbeb',
                            color: isReceived ? '#059669' : '#d97706',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isReceived ? 'Received (In WH)' : po.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        ETB {Number(po.totalAmountEtb || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: isPaid ? '#f0fdf4' : '#fef2f2',
                            color: isPaid ? '#16a34a' : '#dc2626',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isPaid ? 'Settled' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setViewPurchase(po)}
                          style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0.25rem' }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {!isReceived && (
                          <button
                            onClick={() => {
                              setGrnModalPo(po);
                              if (accounts.length > 0) {
                                setGrnAccountId(accounts[0].id);
                              }
                              if (warehouses.length > 0) {
                                setGrnWarehouseId(po.warehouseId || warehouses[0].id);
                              }
                            }}
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginLeft: '0.5rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            title="Process Goods Received Note (GRN)"
                          >
                            <CheckCircle2 size={13} /> Process GRN
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Purchase Order">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Supplier *
            </label>
            <select
              required
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city || 'Vendor'}) — Terms: {s.paymentTerms || 'Net 30'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Target Receiving Warehouse *
            </label>
            <select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code}) — {w.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={form.expectedDeliveryDate}
              onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Procurement Line Items</label>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [...form.items, { description: '', category: 'rtw', quantity: 1, unitCostEtb: 0 }],
                  })
                }
                style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add Item
              </button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  placeholder="Garment Name or SKU"
                  required
                  value={item.description}
                  onChange={(e) => {
                    const items = [...form.items];
                    items[i].description = e.target.value;
                    setForm({ ...form, items });
                  }}
                  style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
                <select
                  value={item.category || 'shemiz'}
                  onChange={(e) => {
                    const items = [...form.items];
                    items[i].category = e.target.value;
                    setForm({ ...form, items });
                  }}
                  style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                >
                  <option value="shemiz">Shemiz (Shirts / Tops)</option>
                  <option value="pants">Pants & Trousers</option>
                  <option value="electronics">Electronics & Gadgets</option>
                  <option value="traditional">Traditional Habesha</option>
                  <option value="rtw">Ready-to-Wear (RTW)</option>
                  <option value="outerwear">Outerwear & Jackets</option>
                  <option value="footwear">Footwear & Shoes</option>
                  <option value="accessories">Accessories & Bags</option>
                  <option value="suits">Suits & Formalwear</option>
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  required
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const items = [...form.items];
                    items[i].quantity = Number(e.target.value);
                    setForm({ ...form, items });
                  }}
                  style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
                <input
                  type="number"
                  placeholder="Cost (ETB)"
                  required
                  min="0"
                  value={item.unitCostEtb || ''}
                  onChange={(e) => {
                    const items = [...form.items];
                    items[i].unitCostEtb = Number(e.target.value);
                    setForm({ ...form, items });
                  }}
                  style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const items = form.items.filter((_, idx) => idx !== i);
                      setForm({ ...form, items });
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Total Procurement Cost:</span>
            <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0284c7' }}>ETB {totalAmount.toLocaleString()}</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Notes & Contract Terms
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ flex: 1, padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.supplierId}
              style={{
                flex: 2,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '0.625rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Goods Received Note (GRN) Processing Modal */}
      {grnModalPo && (() => {
        const requiredAmount = Number(grnModalPo.totalAmountEtb || 0);
        const selectedAcc = accounts.find((a: any) => a.id === grnAccountId) || accounts[0];
        const currentBalance = Number(selectedAcc?.currentBalance || 0);
        const isInsufficient = currentBalance < requiredAmount;

        return (
          <Modal
            isOpen={!!grnModalPo}
            onClose={() => setGrnModalPo(null)}
            title={`Process Goods Received Note (GRN) — PO #${grnModalPo.id.slice(0, 10)}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', padding: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PackageCheck size={16} /> Warehouse Goods Receipt & Auto-Restock
                </div>
                <p style={{ margin: 0, color: '#15803d', fontSize: '0.75rem' }}>
                  Confirming GRN will deposit all received physical pieces directly into the selected warehouse, and deduct procurement cost from the chosen bank account.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Supplier:</span>
                <span style={{ fontWeight: 700 }}>
                  {suppliers.find((s: any) => s.id === grnModalPo.supplierId)?.name || grnModalPo.supplierId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Total Procurement Cost:</span>
                <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1rem' }}>
                  ETB {requiredAmount.toLocaleString()}
                </span>
              </div>

              {/* Destination Warehouse */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Deposit Goods Into Warehouse *
                </label>
                <select
                  value={grnWarehouseId || grnModalPo.warehouseId || (warehouses[0]?.id || '')}
                  onChange={(e) => setGrnWarehouseId(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                >
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) — {w.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paying Bank Account */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Disburse Payment From Account *
                </label>
                <select
                  value={grnAccountId || (accounts[0]?.id || '')}
                  onChange={(e) => setGrnAccountId(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                >
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.bankName}) — Available: ETB {Number(a.currentBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#64748b' }}>
                  Funds will be deducted immediately from this bank account and recorded as a procurement expense.
                </p>
              </div>

              {/* Insufficient Balance Warning Alert */}
              {isInsufficient && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    color: '#b91c1c',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <AlertCircle size={15} /> Insufficient Account Balance
                  </div>
                  <div>
                    Selected account <strong>{selectedAcc?.accountName}</strong> has only <strong>ETB {currentBalance.toLocaleString()}</strong>, but this GRN costs <strong>ETB {requiredAmount.toLocaleString()}</strong>.
                  </div>
                  <div style={{ marginTop: '0.35rem', color: '#7f1d1d' }}>
                    You cannot complete GRN with insufficient funds. Please deposit funds in <strong>Finance & Banking</strong> first, or choose another account.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setGrnModalPo(null)}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={receiveMutation.isPending || isInsufficient}
                  onClick={() => {
                    receiveMutation.mutate({
                      id: grnModalPo.id,
                      data: {
                        accountId: grnAccountId || selectedAcc?.id,
                        warehouseId: grnWarehouseId || grnModalPo.warehouseId || warehouses[0]?.id,
                        payNow: true,
                      },
                    });
                  }}
                  style={{
                    flex: 2,
                    backgroundColor: isInsufficient ? '#94a3b8' : '#16a34a',
                    color: '#ffffff',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    fontWeight: 700,
                    cursor: isInsufficient ? 'not-allowed' : 'pointer',
                  }}
                >
                  {receiveMutation.isPending ? 'Processing GRN...' : isInsufficient ? 'Insufficient Funds' : 'Confirm Goods Receipt & WH Deposit'}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* View PO Details Modal */}
      {viewPurchase && (
        <Modal
          isOpen={!!viewPurchase}
          onClose={() => setViewPurchase(null)}
          title={`Purchase Order #${viewPurchase.id.slice(0, 12)}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div><strong>Supplier:</strong> {suppliers.find((s: any) => s.id === viewPurchase.supplierId)?.name || viewPurchase.supplierId}</div>
            <div><strong>Order Status:</strong> {viewPurchase.status}</div>
            {viewPurchase.grnNumber && <div><strong>GRN Number:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{viewPurchase.grnNumber}</span></div>}
            <div><strong>Payment Status:</strong> {viewPurchase.paymentStatus || 'unpaid'}</div>
            <div><strong>Total Amount:</strong> ETB {Number(viewPurchase.totalAmountEtb || 0).toLocaleString()}</div>
            <div><strong>Created:</strong> {new Date(viewPurchase.createdAt).toLocaleString()}</div>
            {viewPurchase.receivedAt && <div><strong>Received At:</strong> {new Date(viewPurchase.receivedAt).toLocaleString()}</div>}
            {viewPurchase.notes && <div><strong>Notes:</strong> {viewPurchase.notes}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
