import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/AdminStore';
import {
  FileText,
  Palette,
  Check,
  AlertCircle,
} from 'lucide-react';
import { type GarmentStatus, CreateGarmentSchema, validateData } from '@astu/shared';
import { generateImageVariants, uploadImageClusterToR2 } from '../../lib/compressImage';
import { API_URL } from '../../lib/auth-client';
import { CategoryStoreSelector } from '../../components/product-studio/CategoryStoreSelector';
import { PricingProfitMarginCard } from '../../components/product-studio/PricingProfitMarginCard';
import {
  VariantAttributesSelector,
  PRESET_FASHION_COLORS,
  type FashionColor,
} from '../../components/product-studio/VariantAttributesSelector';
import {
  ProductImageUploader,
  type ColorAnglesMap,
  type AngleType,
} from '../../components/product-studio/ProductImageUploader';

export const Route = createFileRoute('/admin/products_/new')({
  component: CreateProductPageComponent,
});

function CreateProductPageComponent() {
  const navigate = useNavigate();
  const { stores, activeStore, addProduct } = useAdminStore();

  const physicalStores = useMemo(() => stores.filter((s) => s.id !== 'all'), [stores]);

  // 1. Store & Category & SKU State
  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    if (activeStore && activeStore.id !== 'all') return activeStore.id;
    return physicalStores[0]?.id || '';
  });

  React.useEffect(() => {
    if (!selectedStoreId && physicalStores.length > 0) {
      setSelectedStoreId(activeStore.id !== 'all' ? activeStore.id : physicalStores[0].id);
    }
  }, [physicalStores, activeStore.id, selectedStoreId]);

  const [selectedCategory, setSelectedCategory] = useState<string>('rtw');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [skuSeed, setSkuSeed] = useState<number>(() => Math.floor(100 + Math.random() * 900));

  // 2. Product Details & Pricing State
  const [title, setTitle] = useState<string>('');
  const [buyingPriceEtb, setBuyingPriceEtb] = useState<number>(3000);
  const [profitMargin, setProfitMargin] = useState<number>(25);
  const [isCustomMargin, setIsCustomMargin] = useState<boolean>(false);
  const [sellingPriceEtb, setSellingPriceEtb] = useState<number>(3750);
  const [initialStock, setInitialStock] = useState<number>(20);
  const [status, setStatus] = useState<GarmentStatus>('in_production');
  const [description, setDescription] = useState<string>('');

  // 3. Multi-Variant Colors & Sizes State
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black']);
  const [customColorsList, setCustomColorsList] = useState<FashionColor[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('astu_saved_custom_colors');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved custom colors', e);
      }
    }
    return [];
  });
  const [newCustomColorName, setNewCustomColorName] = useState<string>('');
  const [newCustomColorHex, setNewCustomColorHex] = useState<string>('#0ea5e9');
  const [isAddingCustomColor, setIsAddingCustomColor] = useState<boolean>(false);

  const [sizeTypeTab, setSizeTypeTab] = useState<'alpha' | 'numeric' | 'footwear' | 'custom'>('alpha');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const [customSizeInput, setCustomSizeInput] = useState<string>('');

  // 4. Color-Scoped Angles State
  const [colorAngles, setColorAngles] = useState<ColorAnglesMap>({});
  const [isUploadingToR2, setIsUploadingToR2] = useState<boolean>(false);

  // 5. Submission & Validation Feedback State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);

  // Auto SKU computation
  const currentStoreObj = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || activeStore,
    [stores, selectedStoreId, activeStore]
  );

  const storeCode = useMemo(() => {
    const name = currentStoreObj.name || 'Store';
    return name.slice(0, 3).toUpperCase();
  }, [currentStoreObj]);

  const catCode = useMemo(() => {
    if (isCreatingNewCat && customCategoryName.trim()) {
      return customCategoryName.trim().slice(0, 3).toUpperCase();
    }
    return selectedCategory.slice(0, 3).toUpperCase();
  }, [isCreatingNewCat, customCategoryName, selectedCategory]);

  const autoSku = useMemo(() => {
    return `ASTU-${storeCode}-${catCode}-${skuSeed}`;
  }, [storeCode, catCode, skuSeed]);

  // Pricing calculations
  const handleBuyingPriceChange = (newBuying: number) => {
    setBuyingPriceEtb(newBuying);
    if (!isCustomMargin) {
      const calculatedSelling = Math.round(newBuying * (1 + profitMargin / 100));
      setSellingPriceEtb(calculatedSelling);
    } else {
      if (newBuying > 0 && sellingPriceEtb > 0) {
        const recalculatedMargin = Math.round(((sellingPriceEtb - newBuying) / newBuying) * 100);
        setProfitMargin(recalculatedMargin);
      }
    }
  };

  const handleProfitMarginPreset = (preset: number) => {
    setIsCustomMargin(false);
    setProfitMargin(preset);
    const calculatedSelling = Math.round(buyingPriceEtb * (1 + preset / 100));
    setSellingPriceEtb(calculatedSelling);
  };

  const handleCustomMarginChange = (marginVal: number) => {
    setIsCustomMargin(true);
    setProfitMargin(marginVal);
    const calculatedSelling = Math.round(buyingPriceEtb * (1 + marginVal / 100));
    setSellingPriceEtb(calculatedSelling);
  };

  const handleSellingPriceChange = (newSelling: number) => {
    setSellingPriceEtb(newSelling);
    setIsCustomMargin(true);
    if (buyingPriceEtb > 0) {
      const calculatedMargin = Math.round(((newSelling - buyingPriceEtb) / buyingPriceEtb) * 100);
      setProfitMargin(calculatedMargin);
    }
  };

  const netUnitProfit = useMemo(() => {
    return Math.max(0, sellingPriceEtb - buyingPriceEtb);
  }, [sellingPriceEtb, buyingPriceEtb]);

  // Color Toggle Handlers
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const handleAddCustomColor = () => {
    if (!newCustomColorName.trim()) return;
    const newCol: FashionColor = {
      name: newCustomColorName.trim(),
      hex: newCustomColorHex,
    };
    const updated = [...customColorsList, newCol];
    setCustomColorsList(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('astu_saved_custom_colors', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save custom color to localStorage', e);
      }
    }
    setSelectedColors((prev) => (prev.includes(newCol.name) ? prev : [...prev, newCol.name]));
    setNewCustomColorName('');
    setIsAddingCustomColor(false);
  };

  // Size Toggle Handlers
  const toggleSize = (sizeLabel: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeLabel) ? prev.filter((s) => s !== sizeLabel) : [...prev, sizeLabel]
    );
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim();
    if (!selectedSizes.includes(clean)) {
      setSelectedSizes((prev) => [...prev, clean]);
    }
    setCustomSizeInput('');
  };

  const getColorHex = (colorName: string): string => {
    const found = [...PRESET_FASHION_COLORS, ...customColorsList].find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return found?.hex || '#0ea5e9';
  };

  // Color-scoped angle image upload handling
  const handleAngleFileSelected = async (colorName: string, angle: AngleType, file: File) => {
    setImageWarning(null);
    if (file.size > 25 * 1024 * 1024) {
      setImageWarning(`File "${file.name}" is too large (>25MB). Please select a standard camera photo.`);
      return;
    }

    // Set processing state immediately with zero lag
    const tempUrl = URL.createObjectURL(file);
    setColorAngles((prev) => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        [angle]: {
          file,
          previewUrl: tempUrl,
          isProcessing: true,
        },
      },
    }));

    try {
      const variants = await generateImageVariants(file);
      setColorAngles((prev) => ({
        ...prev,
        [colorName]: {
          ...prev[colorName],
          [angle]: {
            file,
            previewUrl: variants.previewUrl,
            variants,
            isProcessing: false,
          },
        },
      }));
    } catch (err: any) {
      setImageWarning(`Failed to optimize image: ${err?.message || 'Unsupported format'}`);
      setColorAngles((prev) => {
        const copy = { ...prev };
        if (copy[colorName]) {
          delete copy[colorName][angle];
        }
        return copy;
      });
    }
  };

  const handleAngleRemoved = (colorName: string, angle: AngleType) => {
    setColorAngles((prev) => {
      const current = prev[colorName];
      if (!current) return prev;
      const updated = { ...current };
      delete updated[angle];
      return {
        ...prev,
        [colorName]: updated,
      };
    });
  };

  // Form Submission & R2 Factory Execution
  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setPublishError('Product title is required.');
      return;
    }

    if (selectedColors.length === 0) {
      setPublishError('Please select at least one garment color in Step 3.');
      return;
    }

    // Mandatory Front Angle validation rule
    for (const colorName of selectedColors) {
      const angles = colorAngles[colorName];
      if (!angles || !angles.front || (!angles.front.previewUrl && !angles.front.variants && !angles.front.imageId)) {
        setPublishError(
          `Front angle image is required for "${colorName}". Every garment color variant must have a front hero photo.`
        );
        return;
      }
    }

    setPublishError(null);
    setIsSubmitting(true);
    setIsUploadingToR2(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('astu_admin_auth_token')
          : null;

      // 1. Upload all un-uploaded angle variants in parallel directly to Cloudflare R2
      const updatedAngles: ColorAnglesMap = { ...colorAngles };
      for (const colorName of selectedColors) {
        const angles = updatedAngles[colorName] || {};
        for (const angle of ['front', 'back', 'side'] as AngleType[]) {
          const entry = angles[angle];
          if (entry && entry.variants && !entry.imageId) {
            const uploaded = await uploadImageClusterToR2(API_URL, entry.variants, token);
            entry.imageId = uploaded.imageId;
          }
        }
      }
      setColorAngles(updatedAngles);

      // 2. Construct type-safe color variants with angle roles
      const colorsPayload = selectedColors.map((colorName) => {
        const hex = getColorHex(colorName);
        const angles = updatedAngles[colorName] || {};
        return {
          name: colorName,
          hex,
          images: {
            front: angles.front?.imageId || '',
            back: angles.back?.imageId || undefined,
            side: angles.side?.imageId || undefined,
          },
        };
      });

      // 3. Aggregate all angle image IDs (primary color front first)
      const allImageIds: string[] = [];
      for (const c of colorsPayload) {
        if (c.images.front && !allImageIds.includes(c.images.front)) allImageIds.push(c.images.front);
        if (c.images.back && !allImageIds.includes(c.images.back)) allImageIds.push(c.images.back);
        if (c.images.side && !allImageIds.includes(c.images.side)) allImageIds.push(c.images.side);
      }

      const finalCategory = isCreatingNewCat && customCategoryName.trim()
        ? customCategoryName.trim().toLowerCase()
        : selectedCategory;

      const qty = Number(initialStock) || 1;
      const primaryColor = selectedColors[0] || 'Standard';
      const primarySize = selectedSizes[0] || 'Standard';

      const productPayload = {
        sku: autoSku,
        title: title.trim(),
        category: finalCategory,
        storeId: selectedStoreId,
        priceEtb: Number(sellingPriceEtb) || 0,
        buyingPriceEtb: Number(buyingPriceEtb) || 0,
        profitMargin: Number(profitMargin) || 0,
        stockQuantity: qty,
        initialStock: qty,
        status,
        color: primaryColor,
        size: primarySize,
        colors: colorsPayload,
        sizes: selectedSizes.length > 0 ? selectedSizes : [primarySize],
        images: allImageIds,
        imageUrl: allImageIds[0] || undefined,
        description: description.trim(),
      };

      const validation = validateData(CreateGarmentSchema, productPayload);
      if (!validation.success) {
        setPublishError(validation.error);
        setIsSubmitting(false);
        setIsUploadingToR2(false);
        return;
      }

      await addProduct(productPayload);
      navigate({ to: '/admin/products' });
    } catch (err: any) {
      setPublishError(
        err?.message || 'Failed to publish product to catalog. Please check your inputs and try again.'
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingToR2(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '44px',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'EB Garamond, Georgia, serif',
            margin: 0,
            color: '#0f172a',
            lineHeight: 1.2,
          }}
        >
          Add New Product
        </h1>
      </div>

      <form onSubmit={handlePublishProduct}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Atelier Identity, Pricing & Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Store, Category & Auto-SKU */}
            <CategoryStoreSelector
              selectedStoreId={selectedStoreId}
              setSelectedStoreId={setSelectedStoreId}
              physicalStores={physicalStores}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              isCreatingNewCat={isCreatingNewCat}
              setIsCreatingNewCat={setIsCreatingNewCat}
              customCategoryName={customCategoryName}
              setCustomCategoryName={setCustomCategoryName}
              autoSku={autoSku}
              setSkuSeed={setSkuSeed}
            />

            {/* 2. Product Name & Atelier Notes */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.625rem',
                }}
              >
                <FileText size={16} color="#0ea5e9" />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                  2. Product Identity &amp; Specifications
                </h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Silk Kemis, Tailored Linen Suit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Production Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GarmentStatus)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="in_production">In Production (Active in Store)</option>
                    <option value="draft">Draft (Private Backstage)</option>
                    <option value="quality_check">Quality Check Stage</option>
                    <option value="completed">Completed / Archival</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Atelier Notes &amp; Description
                  </label>
                  <input
                    type="text"
                    placeholder="Composition, cut, weaving notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Pricing & Profit Margin Engine */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.625rem',
                }}
              >
                <FileText size={16} color="#0ea5e9" />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                  3. Pricing &amp; Inventory Engine
                </h3>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                <PricingProfitMarginCard
                  buyingPriceEtb={buyingPriceEtb}
                  handleBuyingPriceChange={handleBuyingPriceChange}
                  sellingPriceEtb={sellingPriceEtb}
                  handleSellingPriceChange={handleSellingPriceChange}
                  profitMargin={profitMargin}
                  isCustomMargin={isCustomMargin}
                  handleProfitMarginPreset={handleProfitMarginPreset}
                  handleCustomMarginChange={handleCustomMarginChange}
                  initialStock={initialStock}
                  setInitialStock={setInitialStock}
                  netUnitProfit={netUnitProfit}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Multi-Variant Options & Media Studio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4. Variant Colors & Sizes */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.625rem',
                }}
              >
                <Palette size={16} color="#0ea5e9" />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                  4. Multi-Variant Options
                </h3>
              </div>

              <VariantAttributesSelector
                selectedColors={selectedColors}
                toggleColor={toggleColor}
                customColorsList={customColorsList}
                isAddingCustomColor={isAddingCustomColor}
                setIsAddingCustomColor={setIsAddingCustomColor}
                newCustomColorName={newCustomColorName}
                setNewCustomColorName={setNewCustomColorName}
                newCustomColorHex={newCustomColorHex}
                setNewCustomColorHex={setNewCustomColorHex}
                handleAddCustomColor={handleAddCustomColor}
                selectedSizes={selectedSizes}
                toggleSize={toggleSize}
                sizeTypeTab={sizeTypeTab}
                setSizeTypeTab={setSizeTypeTab}
                customSizeInput={customSizeInput}
                setCustomSizeInput={setCustomSizeInput}
                handleAddCustomSize={handleAddCustomSize}
              />
            </div>

            {/* 5. Color-Scoped Angle Studio (Cloudflare R2 Direct) */}
            <ProductImageUploader
              selectedColors={selectedColors}
              colorAngles={colorAngles}
              onAngleFileSelected={handleAngleFileSelected}
              onAngleRemoved={handleAngleRemoved}
              getColorHex={getColorHex}
              imageWarning={imageWarning}
              isUploadingToR2={isUploadingToR2}
            />

            {/* Submit Error Banner */}
            {publishError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{publishError}</span>
              </div>
            )}

            {/* Bottom Actions Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => navigate({ to: '/admin/products' })}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: isSubmitting ? '#7dd3fc' : '#0ea5e9',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.25)',
                  opacity: isSubmitting ? 0.85 : 1,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = '#0284c7';
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = '#0ea5e9';
                }}
              >
                <Check size={16} />{' '}
                {isUploadingToR2
                  ? 'Streaming to Cloudflare R2...'
                  : isSubmitting
                  ? 'Publishing Product...'
                  : 'Publish to Inventory'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
