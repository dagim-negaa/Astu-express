import React, { useState } from 'react';
import { Palette, Plus, Ruler, X, Check } from 'lucide-react';

export interface FashionColor {
  name: string;
  hex: string;
  border?: string;
}

export const DEFAULT_BASIC_COLORS: FashionColor[] = [
  { name: 'Light Blue (Brand)', hex: '#0ea5e9' },
  { name: 'Reddish Brown (Accent)', hex: '#8b3224' },
  { name: 'White', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'Black', hex: '#000000' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'Beige / Cream', hex: '#f5f5dc', border: '#cbd5e1' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Orange', hex: '#ea580c' },
];

export const PRESET_FASHION_COLORS = DEFAULT_BASIC_COLORS;

export const PRESET_ALPHA_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const PRESET_NUMERIC_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48'];
export const PRESET_FOOTWEAR_SIZES = ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

interface VariantAttributesSelectorProps {
  selectedColors: string[];
  toggleColor: (colorName: string) => void;
  customColorsList: FashionColor[];
  isAddingCustomColor: boolean;
  setIsAddingCustomColor: (val: boolean) => void;
  newCustomColorName: string;
  setNewCustomColorName: (name: string) => void;
  newCustomColorHex: string;
  setNewCustomColorHex: (hex: string) => void;
  handleAddCustomColor: () => void;
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  sizeTypeTab: 'alpha' | 'numeric' | 'footwear' | 'custom';
  setSizeTypeTab: (tab: 'alpha' | 'numeric' | 'footwear' | 'custom') => void;
  customSizeInput: string;
  setCustomSizeInput: (val: string) => void;
  handleAddCustomSize: () => void;
}

export const VariantAttributesSelector: React.FC<VariantAttributesSelectorProps> = ({
  selectedColors,
  toggleColor,
  customColorsList,
  isAddingCustomColor,
  setIsAddingCustomColor,
  newCustomColorName,
  setNewCustomColorName,
  newCustomColorHex,
  setNewCustomColorHex,
  handleAddCustomColor,
  selectedSizes,
  toggleSize,
  sizeTypeTab,
  setSizeTypeTab,
  customSizeInput,
  setCustomSizeInput,
  handleAddCustomSize,
}) => {
  const [dropdownValue, setDropdownValue] = useState<string>('');

  const allAvailableColors = [...DEFAULT_BASIC_COLORS, ...customColorsList];

  const getColorObj = (name: string): FashionColor => {
    const found = allAvailableColors.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found || { name, hex: '#0ea5e9' };
  };

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    if (val === '__create_new__') {
      setIsAddingCustomColor(true);
      setDropdownValue('');
      return;
    }
    if (!selectedColors.includes(val)) {
      toggleColor(val);
    }
    setDropdownValue('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Colors Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Palette size={14} color="#0ea5e9" />
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#211a13' }}>
              Garment Colors ({selectedColors.length} selected)
            </label>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingCustomColor(!isAddingCustomColor)}
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
            <Plus size={12} /> {isAddingCustomColor ? 'Close' : '+ Create New Color'}
          </button>
        </div>

        {/* Dropdown Menu to Add Colors */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={dropdownValue}
            onChange={handleDropdownSelect}
            style={{
              flex: 1,
              padding: '0.45rem 0.65rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#211a13',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">-- Choose a color to add to piece --</option>
            <optgroup label="Common Colors">
              {DEFAULT_BASIC_COLORS.map((c) => {
                const isAdded = selectedColors.includes(c.name);
                return (
                  <option key={c.name} value={c.name} disabled={isAdded}>
                    {c.name} {isAdded ? '✓ (Already Added)' : ''}
                  </option>
                );
              })}
            </optgroup>
            {customColorsList.length > 0 && (
              <optgroup label="Saved Custom Colors">
                {customColorsList.map((c) => {
                  const isAdded = selectedColors.includes(c.name);
                  return (
                    <option key={c.name} value={c.name} disabled={isAdded}>
                      {c.name} {isAdded ? '✓ (Already Added)' : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
            <option value="__create_new__">+ Create New Color...</option>
          </select>
        </div>

        {/* Inline Custom Color Creator */}
        {isAddingCustomColor && (
          <div
            style={{
              marginTop: '0.625rem',
              backgroundColor: '#fcfbf9',
              border: '1px solid #e8e2d8',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Color Name (e.g. Sage Green, Terracotta)"
              value={newCustomColorName}
              onChange={(e) => setNewCustomColorName(e.target.value)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.4rem 0.6rem',
                borderRadius: '0.25rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="color"
                value={newCustomColorHex}
                onChange={(e) => setNewCustomColorHex(e.target.value)}
                style={{
                  width: '32px',
                  height: '30px',
                  padding: '0',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace' }}>
                {newCustomColorHex}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddCustomColor}
              style={{
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Check size={12} /> Save &amp; Add
            </button>
          </div>
        )}

        {/* Selected Active Colors Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
          {selectedColors.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.6875rem', color: '#dc2626', fontWeight: 600 }}>
              * Select at least one color above for this garment.
            </p>
          ) : (
            selectedColors.map((colorName, idx) => {
              const c = getColorObj(colorName);
              const isCover = idx === 0;

              return (
                <div
                  key={colorName}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.375rem',
                    backgroundColor: isCover ? '#fdf4f2' : '#ffffff',
                    border: isCover ? '1.5px solid #8b3224' : '1px solid #cbd5e1',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#211a13',
                  }}
                >
                  <span
                    style={{
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: c.border ? `1px solid ${c.border}` : '1px solid rgba(0,0,0,0.15)',
                      flexShrink: 0,
                    }}
                  />
                  <span>{colorName}</span>

                  {isCover && (
                    <span
                      style={{
                        backgroundColor: '#8b3224',
                        color: '#ffffff',
                        fontSize: '0.5625rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '0.2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Cover
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleColor(colorName)}
                    title="Remove color"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '0.15rem',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Sizes Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Ruler size={14} color="#0ea5e9" />
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#211a13' }}>
              Garment Sizes ({selectedSizes.length} selected)
            </label>
          </div>
        </div>

        {/* Size Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #e8e2d8', paddingBottom: '0.35rem', marginBottom: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setSizeTypeTab('alpha')}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: sizeTypeTab === 'alpha' ? '#0ea5e9' : 'transparent',
              color: sizeTypeTab === 'alpha' ? '#ffffff' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Alpha (XS–3XL)
          </button>
          <button
            type="button"
            onClick={() => setSizeTypeTab('numeric')}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: sizeTypeTab === 'numeric' ? '#0ea5e9' : 'transparent',
              color: sizeTypeTab === 'numeric' ? '#ffffff' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Numeric (34–48)
          </button>
          <button
            type="button"
            onClick={() => setSizeTypeTab('footwear')}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: sizeTypeTab === 'footwear' ? '#0ea5e9' : 'transparent',
              color: sizeTypeTab === 'footwear' ? '#ffffff' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Footwear (37–46)
          </button>
          <button
            type="button"
            onClick={() => setSizeTypeTab('custom')}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: sizeTypeTab === 'custom' ? '#0ea5e9' : 'transparent',
              color: sizeTypeTab === 'custom' ? '#ffffff' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Custom
          </button>
        </div>

        {/* Size Pills Grid */}
        {sizeTypeTab === 'alpha' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_ALPHA_SIZES.map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSize(s)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#0ea5e9' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#211a13',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {sizeTypeTab === 'numeric' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_NUMERIC_SIZES.map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSize(s)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#0ea5e9' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#211a13',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {sizeTypeTab === 'footwear' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_FOOTWEAR_SIZES.map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSize(s)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#0ea5e9' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#211a13',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {sizeTypeTab === 'custom' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Custom size (e.g. Free Size, Tailored Bespoke)"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSize();
                }
              }}
              style={{
                flex: 1,
                padding: '0.4rem 0.6rem',
                borderRadius: '0.25rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              style={{
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Add Size
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
