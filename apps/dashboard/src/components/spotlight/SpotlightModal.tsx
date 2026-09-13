import React, { useState, useEffect } from 'react';
import { Search, X, Package, ShoppingBag, Users, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAdminStore } from '../../store/AdminStore';

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { products, orders } = useAdminStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredProducts = query
    ? products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredOrders = query
    ? orders.filter((o) => o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()))
    : [];

  const quickNavs = [
    { label: 'Overview Dashboard', path: '/', icon: ShoppingBag },
    { label: 'Products Catalog', path: '/products', icon: Package },
    { label: 'Orders & Fulfillment', path: '/orders', icon: ShoppingBag },
    { label: 'Clientele CRM', path: '/customers', icon: Users },
    { label: 'Store Settings', path: '/settings', icon: Settings },
  ];

  const handleNav = (path: string) => {
    onClose();
    navigate({ to: path });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        backgroundColor: 'rgba(18, 17, 16, 0.5)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          border: '1px solid #e8e2d8',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #e8e2d8', gap: '0.625rem' }}>
          <Search size={18} color="#8a7a6a" />
          <input
            autoFocus
            type="text"
            placeholder="Type to search products, orders, or pages (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', color: '#211a13' }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a6a' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.625rem' }}>
          {!query ? (
            <div>
              <p style={{ margin: '0.2rem 0.4rem 0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Navigation
              </p>
              {quickNavs.map((nav) => (
                <div
                  key={nav.path}
                  onClick={() => handleNav(nav.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.625rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#211a13',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <nav.icon size={17} color="#0ea5e9" />
                    <span>{nav.label}</span>
                  </div>
                  <ArrowRight size={15} color="#8a7a6a" />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {filteredProducts.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ margin: '0.2rem 0.4rem 0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Products
                  </p>
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleNav('/products')}
                      style={{ padding: '0.5rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title} ({p.sku})</span>
                      <span style={{ fontSize: '0.875rem', color: '#8b3224', fontWeight: 700 }}>ETB {p.priceEtb.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {filteredOrders.length > 0 && (
                <div>
                  <p style={{ margin: '0.2rem 0.4rem 0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Orders
                  </p>
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => handleNav('/orders')}
                      style={{ padding: '0.5rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>#{o.id} - {o.customerName}</span>
                      <span style={{ fontSize: '0.875rem', color: '#8b3224', fontWeight: 700 }}>ETB {o.totalPriceEtb.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 && filteredOrders.length === 0 && (
                <div style={{ padding: '1.75rem', textAlign: 'center', color: '#8a7a6a', fontSize: '0.875rem' }}>
                  No items found matching "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
