import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAdminStore, calculateStockHealth } from '../../store/AdminStore';
import { UpdateStockSchema, validateData } from '@astu/shared';
import { Modal } from '../../components/ui/Modal';
import { Layers, RefreshCw, AlertTriangle, CheckCircle2, PlusCircle } from 'lucide-react';

export const Route = createFileRoute('/admin/inventory')({
  component: InventoryComponent,
});

function InventoryComponent() {
  const { products, updateStockQuantity, restockProduct } = useAdminStore();
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; title: string; currentQty: number; initialStock: number } | null>(null);
  const [restockMode, setRestockMode] = useState<'add' | 'set'>('add');
  const [unitsToAdd, setUnitsToAdd] = useState<number>(10);
  const [exactQuantity, setExactQuantity] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => calculateStockHealth(p.stockQuantity, p.initialStock).isLow).length;

  const handleStockActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const targetQty =
      restockMode === 'add'
        ? Number(unitsToAdd) || 0
        : Number(exactQuantity) || 0;

    const validation = validateData(UpdateStockSchema, { stockQuantity: targetQty });
    if (!validation.success) {
      setValidationError(validation.error || 'Invalid stock quantity provided.');
      return;
    }
    setValidationError(null);

    if (restockMode === 'add') {
      await restockProduct(selectedProduct.id, targetQty);
    } else {
      await updateStockQuantity(selectedProduct.id, targetQty);
    }
    setSelectedProduct(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
          Inventory Management
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
          R2 Express — Track inventory lifecycle, replenishment rates from Ethiopian warehouses, and low stock warnings (&le;20% or &le;5 units).
        </p>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active SKUs</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Hanken Grotesk, system-ui, sans-serif', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {products.length}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Physical Units</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0284c7', fontFamily: 'Hanken Grotesk, system-ui, sans-serif', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {totalStockUnits}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Low Stock Alerts (&le;20% / &le;5)
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: lowStockCount > 0 ? '#8b3224' : '#16a34a', fontFamily: 'Hanken Grotesk, system-ui, sans-serif', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {lowStockCount}
          </div>
        </div>
      </div>

      {/* Inventory List & Health Bars */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
            Stock Health & Depletion Rate
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            Health = (Remaining Units &divide; Batch Baseline) &times; 100%
          </span>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: '#64748b' }}>
            <Layers size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No items currently in inventory.</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem' }}>Add products in the Products tab to begin tracking R2 Express stock health.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9375rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Product & SKU</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>Variant</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em', width: '38%' }}>Stock Health & Depletion</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em', textAlign: 'center' }}>Units Left / Total</th>
                  <th style={{ padding: '0.6rem 1rem', textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em', textAlign: 'right' }}>Restock Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const health = calculateStockHealth(p.stockQuantity, p.initialStock);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: health.isLow ? '#fdf4f2' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.title}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', fontFamily: 'monospace' }}>{p.sku}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{p.color} / {p.size}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${health.percentage}%`,
                                  backgroundColor: health.healthColor,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: health.healthColor, minWidth: '40px', textAlign: 'right' }}>
                              {health.percentage}%
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem' }}>
                            <span style={{ color: '#64748b' }}>
                              {health.unitsSold} sold ({100 - health.percentage}%) &bull; {p.stockQuantity} remaining
                            </span>
                            {health.isOutOfStock ? (
                              <span style={{ color: '#8b3224', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <AlertTriangle size={11} /> Out of Stock
                              </span>
                            ) : health.isLow ? (
                              <span style={{ color: '#8b3224', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <AlertTriangle size={11} /> Low Stock Alert
                              </span>
                            ) : (
                              <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={11} /> Healthy Batch
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: health.healthColor }}>
                          {p.stockQuantity}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                          {' '}/ {health.initialStock}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            const init = p.initialStock ?? (p.stockQuantity > 0 ? p.stockQuantity : 10);
                            setSelectedProduct({ id: p.id, title: p.title, currentQty: p.stockQuantity, initialStock: init });
                            setRestockMode('add');
                            setUnitsToAdd(10);
                            setExactQuantity(p.stockQuantity);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        >
                          <RefreshCw size={14} /> Update / Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Stock / Restock Modal */}
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={`Restock & Inventory — ${selectedProduct?.title}`}>
        {selectedProduct && (
          <form onSubmit={handleStockActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Current Physical Units:</span>
                <strong style={{ color: '#0f172a' }}>{selectedProduct.currentQty} units</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current Batch 100% Baseline:</span>
                <strong style={{ color: '#0f172a' }}>{selectedProduct.initialStock} units</strong>
              </div>
            </div>

            {/* Mode selection tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRestockMode('add')}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: '0.375rem',
                  border: restockMode === 'add' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: restockMode === 'add' ? '#f0f9ff' : '#ffffff',
                  color: restockMode === 'add' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <PlusCircle size={14} /> Add Restock Batch
              </button>
              <button
                type="button"
                onClick={() => setRestockMode('set')}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: '0.375rem',
                  border: restockMode === 'set' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: restockMode === 'set' ? '#f0f9ff' : '#ffffff',
                  color: restockMode === 'set' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={14} /> Set Exact Count
              </button>
            </div>

            {validationError && (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '0.375rem',
                  color: '#b91c1c',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                {validationError}
              </div>
            )}

            {restockMode === 'add' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  Units to Add to Inventory
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={unitsToAdd}
                  onChange={(e) => setUnitsToAdd(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9375rem', fontWeight: 700 }}
                />
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0', fontSize: '0.75rem', color: '#166534' }}>
                  <strong>New Total Physical Stock:</strong> {selectedProduct.currentQty + (Number(unitsToAdd) || 0)} units.
                  <br />
                  <strong>New 100% Health Baseline:</strong> will automatically reset to{' '}
                  <span style={{ fontWeight: 800 }}>{selectedProduct.currentQty + (Number(unitsToAdd) || 0)} units (100% Full)</span>.
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  Adjusted Physical Shelf Count
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={exactQuantity}
                  onChange={(e) => setExactQuantity(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9375rem', fontWeight: 700 }}
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Calculated Stock Health will be:{' '}
                  <strong>
                    {Math.min(100, Math.round(((Number(exactQuantity) || 0) / (selectedProduct.initialStock || 1)) * 100))}%
                  </strong>{' '}
                  of initial {selectedProduct.initialStock} units.
                </div>
              </div>
            )}

            <button
              type="submit"
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '0.55rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                marginTop: '0.25rem',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {restockMode === 'add' ? `Confirm Restock (+${unitsToAdd} Units)` : 'Save Count'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
