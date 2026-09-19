import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import {
  Warehouse as WarehouseIcon,
  Layers,
  TrendingUp,
  Plus,
  Search,
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
  Store,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const Route = createFileRoute('/admin/warehouse')({
  component: WarehouseComponent,
});

export function WarehouseComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddWhModalOpen, setIsAddWhModalOpen] = useState(false);

  // 1. Fetch Warehouses
  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.listWarehouses();
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : [];

  // 2. Fetch Warehouse Items
  const { data: rawItems = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['warehouseItems', selectedWarehouseId, selectedCategory, searchQuery],
    queryFn: async () => {
      const res = await apiClient.listWarehouseItems({
        warehouseId: selectedWarehouseId !== 'all' ? selectedWarehouseId : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        availableOnly: false,
      });
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });
  const items = Array.isArray(rawItems) ? rawItems : [];

  // Warehouse Metrics
  const totalUnits = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const totalValuation = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitCostEtb) || 0),
    0
  );
  const totalTransferred = items.reduce((acc, item) => acc + (Number(item.transferredQuantity) || 0), 0);

  // Create Warehouse Mutation
  const [newWhForm, setNewWhForm] = useState({ name: '', code: '', location: '', isDefault: false });
  const createWhMutation = useMutation({
    mutationFn: async (data: typeof newWhForm) => {
      const res = await apiClient.createWarehouse(data);
      if (!res.success) throw new Error(res.error || 'Failed to create warehouse');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsAddWhModalOpen(false);
      setNewWhForm({ name: '', code: '', location: '', isDefault: false });
    },
    onError: (err: any) => {
      alert(err?.message || 'Error creating warehouse');
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Warehouse Inventory & Storage Hubs
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            All company-owned stock is stored here exclusively via supplier GRN. Products are added to the storefront exclusively from the Product Page.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate({ to: '/admin/products/new' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Package size={14} /> Add Product (Product Page)
          </button>
          <button
            onClick={() => navigate({ to: '/admin/purchases' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Receive Stock via GRN
          </button>
          <button
            onClick={() => setIsAddWhModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Building2 size={14} /> Add Warehouse Hub
          </button>
        </div>
      </div>

      {/* Workflow Explanatory Banner */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.375rem',
          color: '#0369a1',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <AlertCircle size={17} style={{ flexShrink: 0 }} />
        <span>
          <strong>Central Warehouse Rule:</strong> All physical stock owned by the company is stored and cataloged in the warehouse. Items cannot be added to the storefront from here — the <strong>only way</strong> to add or publish products to the storefront is from the <strong>Product Page</strong> by selecting the branch, category, and source warehouse.
        </span>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Available WH Units</span>
            <div style={{ backgroundColor: '#f0fdf4', padding: '0.35rem', borderRadius: '0.375rem', color: '#16a34a' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {totalUnits.toLocaleString()} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Ready for store allocation</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inventory Value</span>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.35rem', borderRadius: '0.375rem', color: '#0284c7' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            ETB {totalValuation.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>At cost procurement valuation</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Transferred to Stores</span>
            <div style={{ backgroundColor: '#fdf2f8', padding: '0.35rem', borderRadius: '0.375rem', color: '#db2777' }}>
              <Store size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {totalTransferred.toLocaleString()} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748b' }}>pcs</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Currently on storefront catalog</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Storage Hubs</span>
            <div style={{ backgroundColor: '#fefce8', padding: '0.35rem', borderRadius: '0.375rem', color: '#ca8a04' }}>
              <WarehouseIcon size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {warehouses.length} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748b' }}>depots</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Central AA & Regional Terminals</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          padding: '0.85rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search item, GRN #, or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Warehouse:</label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
          >
            <option value="all">All Warehouses ({warehouses.length})</option>
            {warehouses.map((wh: any) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>

          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginLeft: '0.5rem' }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
          >
            <option value="all">All Categories</option>
            <option value="shemiz">Shemiz (Shirts / Tops)</option>
            <option value="pants">Pants & Trousers</option>
            <option value="electronics">Electronics & Gadgets</option>
            <option value="traditional">Traditional Habesha</option>
            <option value="rtw">Ready to Wear (RTW)</option>
            <option value="suits">Suits & Formal</option>
            <option value="outerwear">Outerwear & Jackets</option>
            <option value="footwear">Footwear</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Warehouse Items Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isItemsLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading warehouse inventory...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <WarehouseIcon size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#0284c7' }} />
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              No warehouse inventory found
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Items enter warehouse inventory when Goods Received Notes (GRN) are processed from suppliers.
            </p>
            <button
              onClick={() => navigate({ to: '/admin/purchases' })}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go to Procurement & Process GRN
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Item / Description</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Warehouse</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>GRN / Supplier</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Cost / Pc</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Available Stock</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Transferred</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Storefront Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const whObj = warehouses.find((w: any) => w.id === item.warehouseId);
                  const isAvailable = Number(item.quantity) > 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.itemTitle}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>ID: {item.id}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.6875rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.category || 'rtw'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>
                        <div style={{ fontWeight: 600 }}>{whObj?.name || item.warehouseId}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{whObj?.location || 'Depot'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#16a34a' }}>{item.grnNumber || 'GRN'}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{item.supplierName || 'Vendor'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        ETB {Number(item.unitCostEtb || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '0.25rem',
                            backgroundColor: isAvailable ? '#f0fdf4' : '#fef2f2',
                            color: isAvailable ? '#16a34a' : '#dc2626',
                            fontWeight: 800,
                            fontSize: '0.8125rem',
                          }}
                        >
                          {Number(item.quantity).toLocaleString()} pcs
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {Number(item.transferredQuantity || 0).toLocaleString()} pcs
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor:
                              item.status === 'in_warehouse'
                                ? '#ecfdf5'
                                : item.status === 'partially_transferred'
                                ? '#eff6ff'
                                : '#f8fafc',
                            color:
                              item.status === 'in_warehouse'
                                ? '#059669'
                                : item.status === 'partially_transferred'
                                ? '#2563eb'
                                : '#64748b',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.status ? item.status.replace(/_/g, ' ') : 'in warehouse'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {Number(item.transferredQuantity) > 0 ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={12} /> Active ({Number(item.transferredQuantity)} pcs)
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#f8fafc',
                              color: '#64748b',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            In Warehouse Only
                          </span>
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

      {/* Add New Warehouse Modal */}
      <Modal isOpen={isAddWhModalOpen} onClose={() => setIsAddWhModalOpen(false)} title="Add Warehouse Depot">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createWhMutation.mutate(newWhForm);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Warehouse Name *
            </label>
            <input
              required
              placeholder="e.g. Adama Regional Depot"
              value={newWhForm.name}
              onChange={(e) => setNewWhForm({ ...newWhForm, name: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Warehouse Code * (e.g. WH-AD-02)
            </label>
            <input
              required
              placeholder="WH-CODE"
              value={newWhForm.code}
              onChange={(e) => setNewWhForm({ ...newWhForm, code: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Location / Address *
            </label>
            <input
              required
              placeholder="e.g. Adama Logistics Park, Terminal 2"
              value={newWhForm.location}
              onChange={(e) => setNewWhForm({ ...newWhForm, location: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddWhModalOpen(false)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createWhMutation.isPending}
              style={{
                flex: 2,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '0.6rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {createWhMutation.isPending ? 'Saving...' : 'Save Warehouse Hub'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
