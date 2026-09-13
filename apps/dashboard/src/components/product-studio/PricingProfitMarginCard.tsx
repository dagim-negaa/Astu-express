import React from 'react';
import { TrendingUp } from 'lucide-react';

const PROFIT_MARGIN_PRESETS = [5, 10, 15, 25];

interface PricingProfitMarginCardProps {
  buyingPriceEtb: number;
  handleBuyingPriceChange: (val: number) => void;
  sellingPriceEtb: number;
  handleSellingPriceChange: (val: number) => void;
  profitMargin: number;
  isCustomMargin: boolean;
  handleProfitMarginPreset: (marginPct: number) => void;
  handleCustomMarginChange: (customMarginPct: number) => void;
  initialStock: number;
  setInitialStock: (stock: number) => void;
  netUnitProfit: number;
}

export const PricingProfitMarginCard: React.FC<PricingProfitMarginCardProps> = ({
  buyingPriceEtb,
  handleBuyingPriceChange,
  sellingPriceEtb,
  handleSellingPriceChange,
  profitMargin,
  isCustomMargin,
  handleProfitMarginPreset,
  handleCustomMarginChange,
  initialStock,
  setInitialStock,
  netUnitProfit,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Buying / Acquisition Price */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.35rem' }}>
            Buying Price (Cost)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: '#8a7a6a' }}>
              ETB
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={buyingPriceEtb}
              onChange={(e) => handleBuyingPriceChange(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.85rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            />
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', marginTop: '0.2rem', display: 'block' }}>
            Atelier wholesale acquisition cost.
          </span>
        </div>

        {/* Selling Price */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.35rem' }}>
            Selling Price (ETB) *
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: '#8b3224' }}>
              ETB
            </span>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={sellingPriceEtb}
              onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.85rem',
                borderRadius: '0.375rem',
                border: '1.5px solid #8b3224',
                fontSize: '0.875rem',
                fontWeight: 800,
                color: '#8b3224',
                backgroundColor: '#fdf4f2',
              }}
            />
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 700, marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={11} /> Net Profit: +ETB {netUnitProfit.toLocaleString()} ({profitMargin}%)
          </span>
        </div>

        {/* Initial Stock Baseline */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.35rem' }}>
            Initial Batch Stock *
          </label>
          <input
            type="number"
            required
            min="1"
            value={initialStock}
            onChange={(e) => setInitialStock(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          />
          <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', marginTop: '0.2rem', display: 'block' }}>
            Sets initial 100% capacity baseline for health tracking.
          </span>
        </div>
      </div>

      {/* Profit Margin Preset Buttons */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Profit Margin % Presets (5%, 10%, 15%, 25%)
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#8b3224', fontWeight: 700 }}>
            Active Margin: {profitMargin}%
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {PROFIT_MARGIN_PRESETS.map((pct) => {
            const isSelected = !isCustomMargin && profitMargin === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => handleProfitMarginPreset(pct)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '0.375rem',
                  border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                  backgroundColor: isSelected ? '#0ea5e9' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pct}%
              </button>
            );
          })}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <input
              type="number"
              placeholder="Custom %"
              value={isCustomMargin ? profitMargin : ''}
              onChange={(e) => handleCustomMarginChange(Number(e.target.value))}
              style={{
                width: '80px',
                padding: '0.3rem 0.5rem',
                borderRadius: '0.375rem',
                border: isCustomMargin ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                backgroundColor: isCustomMargin ? '#f0f9ff' : '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8a7a6a' }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
