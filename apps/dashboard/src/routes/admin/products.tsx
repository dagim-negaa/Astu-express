import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAdminStore, calculateStockHealth } from '../../store/AdminStore';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  Search,
  Package,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  Trash2,
  Warehouse,
} from 'lucide-react';

export const Route = createFileRoute('/admin/products')({
  component: ProductsComponent,
});

function ProductsComponent() {
  const navigate = useNavigate();
  const { products, restockProduct, toggleSpotlight, deleteProduct, clearAllProducts } = useAdminStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [spotlightOnly, setSpotlightOnly] = useState<boolean>(false);

  // Dropdown menu state for Add Product button
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Restock Modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockCategory, setRestockCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [restockQuantity, setRestockQuantity] = useState<number>(10);
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string | null>(null);

  // Close Add Product menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const spotlightCount = useMemo(() => products.filter((p) => p.isFeatured).length, [products]);

  // Extract unique categories across catalog
  const uniqueCategories = useMemo(() => {
    const defaultCats = ['rtw', 'accessories', 'footwear'];
    const productCats = products.map((p) => p.category.toLowerCase());
    const combined = Array.from(new Set([...defaultCats, ...productCats]));
    return combined.map((c) => ({
      key: c,
      label:
        c === 'rtw'
          ? 'Ready-to-Wear (RTW)'
          : c.charAt(0).toUpperCase() + c.slice(1),
    }));
  }, [products]);

  // Filtered products for display
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSpotlight = !spotlightOnly || Boolean(p.isFeatured);
      const matchesCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSpotlight && matchesCat && matchesQuery;
    });
  }, [products, categoryFilter, searchQuery, spotlightOnly]);

  // Products available in Restock Modal
  const restockEligibleProducts = useMemo(() => {
    if (restockCategory === 'all') return products;
    return products.filter((p) => p.category.toLowerCase() === restockCategory.toLowerCase());
  }, [products, restockCategory]);

  // Active product selected in restock modal
  const activeRestockTarget = useMemo(() => {
    if (!selectedProductId) return restockEligibleProducts[0] || null;
    return products.find((p) => p.id === selectedProductId) || restockEligibleProducts[0] || null;
  }, [selectedProductId, restockEligibleProducts, products]);

  const handleOpenRestockModal = (targetProductId?: string) => {
    setIsAddMenuOpen(false);
    setRestockSuccessMsg(null);
    if (targetProductId) {
      const p = products.find((prod) => prod.id === targetProductId);
      if (p) {
        setRestockCategory(p.category.toLowerCase());
        setSelectedProductId(p.id);
      }
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setRestockCategory('all');
    }
    setRestockQuantity(10);
    setIsRestockModalOpen(true);
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestockTarget || restockQuantity <= 0) return;

    await restockProduct(activeRestockTarget.id, Number(restockQuantity));
    setRestockSuccessMsg(`Successfully added +${restockQuantity} units to ${activeRestockTarget.title}!`);

    setTimeout(() => {
      setIsRestockModalOpen(false);
      setRestockSuccessMsg(null);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>
            Products
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            ASTU Express Catalog & Inventory Management
          </p>
        </div>

        {/* Split Dropdown Button */}
        <div ref={addMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '0.5rem 0.95rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
          >
            <Plus size={15} /> Add Product <ChevronDown size={13} style={{ transform: isAddMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {isAddMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '0.375rem',
                width: '260px',
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 40,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.375rem' }}>
                <button
                  onClick={() => handleOpenRestockModal()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ padding: '0.35rem', borderRadius: '0.25rem', backgroundColor: '#e0f2fe', color: '#0284c7', marginTop: '0.1rem' }}>
                    <RefreshCw size={15} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                      Restock Existing Product
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b', marginTop: '0.1rem' }}>
                      Select a category and add inventory quantity to an existing garment.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    navigate({ to: '/admin/products/new' });
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ padding: '0.35rem', borderRadius: '0.25rem', backgroundColor: '#f0fdf4', color: '#16a34a', marginTop: '0.1rem' }}>
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                      Create New Product
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b', marginTop: '0.1rem' }}>
                      Open full creator page to design new styles with auto-generated ASTU SKU.
                    </span>
                  </div>
                </button>

                {products.length > 0 && (
                  <button
                    onClick={async () => {
                      setIsAddMenuOpen(false);
                      if (confirm('Are you sure you want to delete ALL products from database & local inventory?')) {
                        await clearAllProducts();
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderTop: '1px solid #f1f5f9',
                      marginTop: '0.25rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ padding: '0.35rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', color: '#b91c1c', marginTop: '0.1rem' }}>
                      <Trash2 size={15} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#b91c1c' }}>
                        Clear All Products
                      </span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: '#991b1b', marginTop: '0.1rem' }}>
                        Wipe all demo / current items to start with a fresh ASTU catalog.
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Central Company Warehouse & Storefront Source Banner */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem', color: '#334155' }}>
          <Warehouse size={17} color="#0284c7" style={{ flexShrink: 0 }} />
          <span>
            <strong>Company Inventory Invariant:</strong> All physical company stock is owned and held in warehouses via GRN. The <strong>only way</strong> to add or list a product on the storefront is right here on this <strong>Product Page</strong> by selecting the branch, category, and source warehouse item into production.
          </span>
        </div>
        <button
          onClick={() => navigate({ to: '/admin/warehouse' })}
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            padding: '0.35rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Warehouse size={13} /> View Warehouse Stock
        </button>
      </div>

      {/* Filter Bar: Category Dropdown & Search & Spotlight Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
              <Filter size={14} color="#0ea5e9" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Categories ({products.length})</option>
              {uniqueCategories.map((cat) => {
                const count = products.filter((p) => p.category.toLowerCase() === cat.key).length;
                return (
                  <option key={cat.key} value={cat.key}>
                    {cat.label} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Spotlight Filter Button */}
          <button
            onClick={() => setSpotlightOnly(!spotlightOnly)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.375rem',
              border: spotlightOnly ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
              backgroundColor: spotlightOnly ? '#f0f9ff' : '#ffffff',
              color: spotlightOnly ? '#0284c7' : '#64748b',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={13} color={spotlightOnly ? '#0ea5e9' : '#64748b'} />
            <span>Spotlight Pieces ({spotlightCount})</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search SKU or title..."
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

      {/* Products Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Product Catalog ({filteredProducts.length})</span>
          {(categoryFilter !== 'all' || spotlightOnly) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setSpotlightOnly(false);
              }}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem 1.25rem', textAlign: 'center', color: '#64748b' }}>
            <Package size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No products found.</p>
            <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.8125rem' }}>
              {products.length === 0
                ? 'Your inventory catalog is currently empty. Click "Add Product" above to create your first item.'
                : 'No items match your active search or category filters.'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => navigate({ to: '/admin/products/new' })}
                style={{
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)',
                }}
              >
                <Plus size={14} /> Create First Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SKU</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Garment Title</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Variant</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Price (ETB)</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Stock</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Spotlight</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {p.sku}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {p.color} / {p.size}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#8b3224' }}>
                      ETB {p.priceEtb.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {(() => {
                        const health = calculateStockHealth(p.stockQuantity, p.initialStock);
                        return (
                          <div>
                            <span style={{ fontWeight: 800, color: health.healthColor }}>
                              {p.stockQuantity} units
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.35rem' }}>
                              ({health.percentage}%)
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {p.isFeatured ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <Sparkles size={11} color="#d97706" /> In Spotlight
                          </span>
                          <button
                            onClick={() => toggleSpotlight(p.id)}
                            title="Remove from Mobile Home Spotlight"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '0.15rem 0.25rem',
                              textDecoration: 'underline',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleSpotlight(p.id)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#0284c7',
                            border: '1px solid #e2e8f0',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#0ea5e9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <Sparkles size={12} color="#0ea5e9" /> + Add to Spotlight
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusPill status={p.status} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenRestockModal(p.id)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#0284c7',
                            border: '1px solid #e2e8f0',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#0ea5e9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <RefreshCw size={12} /> Restock
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete "${p.title}" (${p.sku})?`)) {
                              await deleteProduct(p.id);
                            }
                          }}
                          style={{
                            backgroundColor: '#fff5f5',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            padding: '0.25rem 0.45rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete Garment"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Existing Product Modal */}
      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title="Restock Existing Product">
        <form onSubmit={handleExecuteRestock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {restockSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{restockSuccessMsg}</span>
            </div>
          )}

          {/* Filter Category in Modal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              1. Filter Category
            </label>
            <select
              value={restockCategory}
              onChange={(e) => {
                setRestockCategory(e.target.value);
                const match = products.find(
                  (p) => e.target.value === 'all' || p.category.toLowerCase() === e.target.value.toLowerCase()
                );
                if (match) setSelectedProductId(match.id);
              }}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Select Product Item */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              2. Select Garment Item *
            </label>
            {restockEligibleProducts.length === 0 ? (
              <p style={{ fontSize: '0.78125rem', color: '#dc2626', margin: 0 }}>
                No products found in this category.
              </p>
            ) : (
              <select
                value={activeRestockTarget?.id || ''}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                {restockEligibleProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.sku}) — Current Stock: {p.stockQuantity} units
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity to Add */}
          {activeRestockTarget && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                3. Quantity to Add (Restock Units) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
                Current: <strong>{activeRestockTarget.stockQuantity}</strong> units &rarr; New Total:{' '}
                <strong style={{ color: '#16a34a' }}>{activeRestockTarget.stockQuantity + Number(restockQuantity || 0)}</strong> units
                {' '}(New 100% batch capacity baseline)
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={!activeRestockTarget || restockQuantity <= 0}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: !activeRestockTarget ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeRestockTarget) e.currentTarget.style.backgroundColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              if (activeRestockTarget) e.currentTarget.style.backgroundColor = '#0ea5e9';
            }}
          >
            Confirm & Update Stock
          </button>
        </form>
      </Modal>
    </div>
  );
}
