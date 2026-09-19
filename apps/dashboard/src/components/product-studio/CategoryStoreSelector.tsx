import React from 'react';
import { Layers, Store, Plus, RefreshCw, Star, Warehouse } from 'lucide-react';
import type { StoreLocation } from '../../store/AdminStore';

interface CategoryStoreSelectorProps {
  selectedStoreId: string;
  setSelectedStoreId: (id: string) => void;
  physicalStores: StoreLocation[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedWarehouseId?: string;
  setSelectedWarehouseId?: (id: string) => void;
  warehouses?: any[];
  isCreatingNewCat: boolean;
  setIsCreatingNewCat: (val: boolean) => void;
  customCategoryName: string;
  setCustomCategoryName: (name: string) => void;
  autoSku: string;
  setSkuSeed: (seed: number) => void;
}

export const CategoryStoreSelector: React.FC<CategoryStoreSelectorProps> = ({
  selectedStoreId,
  setSelectedStoreId,
  physicalStores,
  selectedCategory,
  setSelectedCategory,
  selectedWarehouseId,
  setSelectedWarehouseId,
  warehouses = [],
  isCreatingNewCat,
  setIsCreatingNewCat,
  customCategoryName,
  setCustomCategoryName,
  autoSku,
  setSkuSeed,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        border: '1px solid #e8e2d8',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          borderBottom: '1px solid #f0eae1',
          paddingBottom: '0.625rem',
        }}
      >
        <Layers size={16} color="#0ea5e9" />
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#211a13' }}>
          1. Branch, Category & Source Warehouse
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Store Selector */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#211a13',
              marginBottom: '0.35rem',
            }}
          >
            <Store size={13} color="#0ea5e9" /> Store Branch *
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              backgroundColor: '#ffffff',
              fontWeight: 600,
              color: '#211a13',
            }}
          >
            {physicalStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#211a13' }}>
              Category *
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewCat(!isCreatingNewCat);
                if (!isCreatingNewCat) setCustomCategoryName('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <Plus size={12} /> {isCreatingNewCat ? 'Use Standard' : '+ Custom Category'}
            </button>
          </div>

          {isCreatingNewCat ? (
            <input
              type="text"
              required
              placeholder="e.g. Traditional, Footwear, Leather..."
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1.5px solid #0ea5e9',
                fontSize: '0.8125rem',
                backgroundColor: '#f0f9ff',
              }}
            />
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#211a13',
              }}
            >
              <option value="rtw">Ready-to-Wear (RTW)</option>
              <option value="traditional">Traditional & Habesha Bespoke</option>
              <option value="accessories">Luxury Accessories</option>
              <option value="footwear">Footwear & Shoes</option>
              <option value="outerwear">Outerwear & Blazers</option>
            </select>
          )}
        </div>

        {/* Source Warehouse Selector */}
        {setSelectedWarehouseId && (
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#211a13',
                marginBottom: '0.35rem',
              }}
            >
              <Warehouse size={13} color="#0ea5e9" /> Source Warehouse *
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#211a13',
              }}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Auto-Generated SKU */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#211a13' }}>
              Auto-Generated SKU
            </label>
            <button
              type="button"
              onClick={() => setSkuSeed(Math.floor(100 + Math.random() * 900))}
              title="Generate new random code"
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              readOnly
              value={autoSku}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2rem',
                borderRadius: '0.375rem',
                border: '1px solid #e8e2d8',
                backgroundColor: '#f8fafc',
                color: '#1e293b',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            />
            <Star
              size={13}
              color="#0ea5e9"
              style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#8a7a6a' }}>
            Combines Category + Store + Random Seed for multi-location inventory.
          </p>
        </div>
      </div>
    </div>
  );
};
