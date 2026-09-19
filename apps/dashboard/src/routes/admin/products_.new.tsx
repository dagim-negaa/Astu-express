import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAdminStore } from '../../store/AdminStore';
import {
  FileText,
  Palette,
  Check,
  AlertCircle,
  Warehouse,
  Store,
  Layers,
} from 'lucide-react';
import { type GarmentStatus } from '@astu/shared';
import { generateImageVariants, uploadImageClusterToR2 } from '../../lib/compressImage';
import { API_URL } from '../../lib/auth-client';
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
  const queryClient = useQueryClient();
  const { stores, activeStore } = useAdminStore();

  const physicalStores = useMemo(() => stores.filter((s) => s.id !== 'all'), [stores]);

  // Read URL search params if navigated from warehouse page
  const initialParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return {
        warehouseId: sp.get('warehouseId') || '',
        warehouseItemId: sp.get('warehouseItemId') || sp.get('itemId') || '',
        category: sp.get('category') || '',
      };
    }
    return { warehouseId: '', warehouseItemId: '', category: '' };
  }, []);

  // Fetch Warehouses
  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.listWarehouses();
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : [];

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => initialParams.warehouseId || '');

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

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

  const [selectedCategory, setSelectedCategory] = useState<string>(() => initialParams.category || 'shemiz');
  const [skuSeed, setSkuSeed] = useState<number>(() => Math.floor(100 + Math.random() * 900));

  // Query all available warehouse items in the selected warehouse
  const { data: rawAllWhItems = [], isLoading: isWhItemsLoading } = useQuery({
    queryKey: ['whItemsForProductStudioAll', selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiClient.listWarehouseItems({
        warehouseId: selectedWarehouseId,
        availableOnly: true,
      });
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
    enabled: Boolean(selectedWarehouseId),
  });
  const allWhItems = Array.isArray(rawAllWhItems) ? rawAllWhItems : [];

  // Group warehouse items stock by category
  const categoryStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of allWhItems) {
      const cat = (item.category || 'rtw').toLowerCase();
      map[cat] = (map[cat] || 0) + (Number(item.quantity) || 0);
    }
    return map;
  }, [allWhItems]);

  // Master list of supported categories (Classic design without emojis)
  const CATEGORY_LIST = useMemo(() => {
    const base = [
      { key: 'shemiz', label: 'Shemiz (Shirts / Tops)' },
      { key: 'pants', label: 'Pants & Trousers' },
      { key: 'electronics', label: 'Electronics & Gadgets' },
      { key: 'traditional', label: 'Traditional Habesha' },
      { key: 'rtw', label: 'Ready-to-Wear (RTW)' },
      { key: 'outerwear', label: 'Outerwear & Jackets' },
      { key: 'footwear', label: 'Footwear & Shoes' },
      { key: 'accessories', label: 'Accessories & Bags' },
      { key: 'suits', label: 'Suits & Formalwear' },
    ];
    const baseKeys = new Set(base.map((b) => b.key));
    const extra: typeof base = [];
    for (const item of allWhItems) {
      const cat = (item.category || '').toLowerCase().trim();
      if (cat && !baseKeys.has(cat)) {
        baseKeys.add(cat);
        extra.push({
          key: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
        });
      }
    }
    return [...base, ...extra];
  }, [allWhItems]);

  // Matching items in this warehouse under selectedCategory
  const matchingCategoryItems = useMemo(() => {
    return allWhItems.filter(
      (item: any) =>
        (item.category || 'rtw').toLowerCase() === selectedCategory.toLowerCase() &&
        Number(item.quantity) > 0
    );
  }, [allWhItems, selectedCategory]);

  const totalCategoryStock = useMemo(() => {
    return matchingCategoryItems.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0);
  }, [matchingCategoryItems]);

  // Selected warehouse item state (only 1 item batch at a time can be added to production)
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<any>(null);

  // Production quantity state: "How much [Category] items add on production?"
  const [quantityToProduce, setQuantityToProduce] = useState<number>(1);

  // 2. Product Details & Pricing State
  const [title, setTitle] = useState<string>('');
  const [buyingPriceEtb, setBuyingPriceEtb] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(25);
  const [isCustomMargin, setIsCustomMargin] = useState<boolean>(false);
  const [sellingPriceEtb, setSellingPriceEtb] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(1);
  const [status, setStatus] = useState<GarmentStatus>('in_production');
  const [description, setDescription] = useState<string>('');

  const handleSelectWarehouseItem = (item: any) => {
    setSelectedWarehouseItem(item);
    setTitle(item.itemTitle);
    const cost = Number(item.unitCostEtb) || 0;
    setBuyingPriceEtb(cost);
    const calculatedSelling = cost > 0 ? Math.round(cost * (1 + profitMargin / 100)) : 1000;
    setSellingPriceEtb(calculatedSelling);
    const maxQty = Number(item.quantity) || 1;
    const initialQty = Math.min(quantityToProduce || 1, maxQty);
    setQuantityToProduce(initialQty);
    setInitialStock(initialQty);
    setDescription(`Transferred from Warehouse (${item.grnNumber || 'GRN'}) — Supplier: ${item.supplierName || 'Vendor'}`);
    setPublishError(null);
  };

  const handleQuantityChange = (val: number) => {
    const maxQty = Number(selectedWarehouseItem?.quantity) || totalCategoryStock || 1;
    const clean = Math.max(1, Math.min(maxQty, val));
    setQuantityToProduce(clean);
    setInitialStock(clean);
  };

  // Auto-select warehouse item when matching category items change
  useEffect(() => {
    if (matchingCategoryItems.length > 0) {
      if (
        !selectedWarehouseItem ||
        !matchingCategoryItems.some((i: any) => i.id === selectedWarehouseItem.id)
      ) {
        handleSelectWarehouseItem(matchingCategoryItems[0]);
      }
    } else {
      setSelectedWarehouseItem(null);
    }
  }, [matchingCategoryItems, selectedCategory]);

  useEffect(() => {
    if (initialParams.warehouseItemId && allWhItems.length > 0 && !selectedWarehouseItem) {
      const found = allWhItems.find((i: any) => i.id === initialParams.warehouseItemId);
      if (found) {
        handleSelectWarehouseItem(found);
      }
    }
  }, [allWhItems, initialParams.warehouseItemId, selectedWarehouseItem]);

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
    return (selectedCategory || 'GEN').slice(0, 3).toUpperCase();
  }, [selectedCategory]);

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

      const finalCategory = selectedCategory;

      if (!selectedWarehouseItem) {
        setPublishError(
          'Please select a warehouse item received via GRN before adding to storefront production. All storefront goods originate from warehouse inventory.'
        );
        setIsSubmitting(false);
        setIsUploadingToR2(false);
        return;
      }

      const qty = Number(quantityToProduce) || Number(initialStock) || 1;
      if (qty > Number(selectedWarehouseItem.quantity)) {
        setPublishError(
          `Transfer quantity (${qty}) exceeds available warehouse inventory (${selectedWarehouseItem.quantity} pcs).`
        );
        setIsSubmitting(false);
        setIsUploadingToR2(false);
        return;
      }

      const primaryColor = selectedColors[0] || 'Standard';
      const primarySize = selectedSizes[0] || 'Standard';

      const res = await apiClient.transferWarehouseItemToProduction({
        warehouseItemId: selectedWarehouseItem.id,
        storeId: selectedStoreId,
        category: finalCategory,
        transferQuantity: qty,
        sellingPriceEtb: Number(sellingPriceEtb) || 0,
        profitMargin: Number(profitMargin) || 0,
        title: title.trim(),
        description: description.trim(),
        color: primaryColor,
        size: primarySize,
        colors: colorsPayload,
        sizes: selectedSizes.length > 0 ? selectedSizes : [primarySize],
        images: allImageIds,
        imageUrl: allImageIds[0] || undefined,
        status,
        sku: autoSku,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to transfer warehouse item to production');
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });

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
            {/* 1. Branch & Source Warehouse Selection */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
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
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.625rem',
                }}
              >
                <Store size={16} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                  1. Select Store Branch &amp; Source Warehouse
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Store Branch */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Storefront Branch *
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
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {physicalStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Warehouse */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Source Warehouse *
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => {
                      setSelectedWarehouseId(e.target.value);
                      setSelectedWarehouseItem(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto SKU */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Auto-Generated SKU</label>
                    <button
                      type="button"
                      onClick={() => setSkuSeed(Math.floor(100 + Math.random() * 900))}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={autoSku}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Categories inside Selected Warehouse with Live Stock Badges */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Layers size={16} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    2. Categories inside {warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse'}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Select a category to view stock &amp; allocate to production
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.625rem' }}>
                {CATEGORY_LIST.map((cat) => {
                  const stock = categoryStockMap[cat.key.toLowerCase()] || 0;
                  const isSelected = selectedCategory.toLowerCase() === cat.key.toLowerCase();
                  const hasStock = stock > 0;

                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setPublishError(null);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.35rem',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        border: isSelected ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#f1f5f9' : hasStock ? '#ffffff' : '#f8fafc',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isSelected ? '#0f172a' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {cat.key}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.25rem',
                            backgroundColor: hasStock ? '#ecfdf5' : '#f1f5f9',
                            color: hasStock ? '#15803d' : '#94a3b8',
                          }}
                        >
                          {stock} in WH
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? '#0f172a' : '#334155' }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Stock Available & Production Allocation Question */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                border: selectedWarehouseItem ? '2px solid #0284c7' : '1px solid #cbd5e1',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Warehouse size={16} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    3. Stock Available in Warehouse: {totalCategoryStock} pcs of {selectedCategory.toUpperCase()}
                  </h3>
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '0.25rem',
                    backgroundColor: totalCategoryStock > 0 ? '#f0fdf4' : '#fef2f2',
                    color: totalCategoryStock > 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                >
                  {totalCategoryStock > 0 ? `${totalCategoryStock} pcs Available` : '0 pcs in Warehouse'}
                </span>
              </div>

              {isWhItemsLoading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
                  Scanning warehouse inventory...
                </div>
              ) : totalCategoryStock === 0 ? (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#92400e', fontWeight: 800, fontSize: '0.8125rem' }}>
                    <AlertCircle size={16} /> No Available Stock of {selectedCategory.toUpperCase()} in {warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse'}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#b45309', lineHeight: 1.4 }}>
                    All items in this system enter via supplier <strong>Goods Received Notes (GRN)</strong>. To add {selectedCategory.toUpperCase()} items to production, receive inventory from a supplier first in Procurement.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate({ to: '/admin/purchases' })}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Go to Procurement &amp; Process GRN →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dedicated Allocation Question: How much [Category] items add on production? */}
                  <div
                    style={{
                      backgroundColor: '#f0f9ff',
                      border: '1.5px solid #0284c7',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7' }}>
                          Production Allocation Question
                        </span>
                        <h4 style={{ margin: '0.15rem 0 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                          How much {selectedCategory.toUpperCase()} items do you want to add on production?
                        </h4>
                      </div>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 800, fontSize: '0.8125rem', padding: '0.25rem 0.65rem', borderRadius: '0.375rem' }}>
                        Max Available: {selectedWarehouseItem ? selectedWarehouseItem.quantity : totalCategoryStock} pcs
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #0284c7', borderRadius: '0.375rem', backgroundColor: '#fff', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantityToProduce - 1)}
                          disabled={quantityToProduce <= 1}
                          style={{ padding: '0.45rem 0.8rem', background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Number(selectedWarehouseItem?.quantity) || totalCategoryStock}
                          value={quantityToProduce}
                          onChange={(e) => handleQuantityChange(Number(e.target.value))}
                          style={{ width: '70px', textAlign: 'center', border: 'none', fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', padding: '0.4rem 0' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantityToProduce + 1)}
                          disabled={quantityToProduce >= (Number(selectedWarehouseItem?.quantity) || totalCategoryStock)}
                          style={{ padding: '0.45rem 0.8rem', background: '#f8fafc', border: 'none', borderLeft: '1px solid #cbd5e1', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>pieces</span>

                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {[1, 5, 10].map((num) => {
                          const max = Number(selectedWarehouseItem?.quantity) || totalCategoryStock;
                          if (num > max) return null;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleQuantityChange(num)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.25rem',
                                border: '1px solid #cbd5e1',
                                backgroundColor: quantityToProduce === num ? '#0284c7' : '#ffffff',
                                color: quantityToProduce === num ? '#ffffff' : '#0f172a',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              {num} pc{num > 1 ? 's' : ''}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(Number(selectedWarehouseItem?.quantity) || totalCategoryStock)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #0284c7',
                            backgroundColor: quantityToProduce === (Number(selectedWarehouseItem?.quantity) || totalCategoryStock) ? '#0284c7' : '#f0f9ff',
                            color: quantityToProduce === (Number(selectedWarehouseItem?.quantity) || totalCategoryStock) ? '#ffffff' : '#0284c7',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          All Available ({Number(selectedWarehouseItem?.quantity) || totalCategoryStock} pcs)
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Check size={14} />
                      <span>
                        <strong>Allocation Result:</strong> {quantityToProduce} pcs will be transferred from {warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse'} to {physicalStores.find((s) => s.id === selectedStoreId)?.name || 'Store'} storefront. Remaining in warehouse: {Math.max(0, (Number(selectedWarehouseItem?.quantity) || totalCategoryStock) - quantityToProduce)} pcs.
                      </span>
                    </div>
                  </div>

                  {/* Warehouse Batch Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Select Item Batch from Warehouse ({matchingCategoryItems.length} batches available) *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {matchingCategoryItems.map((item: any) => {
                        const isSelected = selectedWarehouseItem?.id === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectWarehouseItem(item)}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: '0.375rem',
                              border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                                {item.itemTitle}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', display: 'flex', gap: '0.6rem', marginTop: '0.15rem' }}>
                                <span>GRN: <strong>{item.grnNumber}</strong></span>
                                <span>Supplier: <strong>{item.supplierName}</strong></span>
                                <span>Cost: <strong>ETB {Number(item.unitCostEtb || 0).toLocaleString()}</strong> / pc</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '0.25rem', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: '0.75rem' }}>
                                {item.quantity} in WH
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#0284c7' : '#94a3b8' }}>
                                {isSelected ? '✓ Selected' : 'Select'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 3. Product Name & Atelier Notes */}
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
                  initialStock={quantityToProduce}
                  setInitialStock={handleQuantityChange}
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
                  ? 'Adding to Storefront Production...'
                  : `Add ${quantityToProduce} ${(selectedCategory || 'Item').toUpperCase()} ${quantityToProduce === 1 ? 'Item' : 'Items'} to Storefront Production`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
