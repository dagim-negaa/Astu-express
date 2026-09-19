import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useStorefrontProduct, useStorefrontProducts } from '../hooks/useStorefrontProducts';
import { useCart } from '../hooks/useCart';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { ProductCard } from '../components/storefront/ProductCard';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, Check, Camera, RefreshCw, Layers } from 'lucide-react';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '@astu/shared';

export const Route = createFileRoute('/product/$id')({
  component: ProductDetailComponent,
});

interface AngleItem {
  angle: 'front' | 'back' | 'side' | string;
  label: string;
  shortTag: string;
  url: string;
}

function ProductDetailComponent() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useStorefrontProduct(id);
  const { data: related = [] } = useStorefrontProducts(product?.category);
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'back' | 'side' | string>('front');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Safely parse sizes
  const sizes: string[] = useMemo(() => {
    if (!product) return [];
    let raw = product.sizes;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    if (!Array.isArray(raw) || raw.length === 0) return ['S', 'M', 'L', 'XL'];
    return raw.map((s: any) => typeof s === 'string' ? s : s?.label || s?.size || 'Standard');
  }, [product]);

  // Safely parse colors
  const parsedColors: any[] = useMemo(() => {
    if (!product) return [];
    let raw = product.colors;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    return Array.isArray(raw) ? raw : [];
  }, [product]);

  const colorNames: string[] = useMemo(() => {
    if (!product) return ['Standard'];
    if (parsedColors.length === 0) return [product.color || 'Standard'];
    return parsedColors.map((c: any) => (typeof c === 'string' ? c : c?.name || 'Standard'));
  }, [parsedColors, product]);

  // Safely parse product images array
  const parsedImages: string[] = useMemo(() => {
    if (!product) return [];
    let raw = product.images;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if ((product as any).imageUrl) return [(product as any).imageUrl];
    if ((product as any).image) return [(product as any).image];
    return [];
  }, [product]);

  // Active color object
  const currentColorObj = useMemo(() => {
    if (parsedColors.length === 0) return null;
    const activeName = selectedColor || colorNames[0];
    return parsedColors.find((c: any) => (typeof c === 'string' ? c : c?.name) === activeName) || parsedColors[0];
  }, [parsedColors, selectedColor, colorNames]);

  // Build full list of angles (Front, Back, Side) for the active color
  const angleEntries: AngleItem[] = useMemo(() => {
    const list: AngleItem[] = [];

    // 1. If color variant has structured angles: { front, back, side }
    if (currentColorObj && typeof currentColorObj === 'object' && currentColorObj.images) {
      const imgs = currentColorObj.images;
      if (imgs.front) {
        list.push({ angle: 'front', label: 'Front View', shortTag: 'Front', url: resolveImageUrl(imgs.front, 'full') });
      }
      if (imgs.back) {
        list.push({ angle: 'back', label: 'Back View', shortTag: 'Back', url: resolveImageUrl(imgs.back, 'full') });
      }
      if (imgs.side) {
        list.push({ angle: 'side', label: 'Side View', shortTag: 'Side', url: resolveImageUrl(imgs.side, 'full') });
      }
    }

    // 2. Fallback to product.images array
    if (list.length === 0 && parsedImages.length > 0) {
      parsedImages.forEach((imgId: string, idx: number) => {
        const angle = idx === 0 ? 'front' : idx === 1 ? 'back' : idx === 2 ? 'side' : `angle_${idx + 1}`;
        const shortTag = idx === 0 ? 'Front' : idx === 1 ? 'Back' : idx === 2 ? 'Side' : `#${idx + 1}`;
        const label = idx === 0 ? 'Front View' : idx === 1 ? 'Back View' : idx === 2 ? 'Side View' : `View ${idx + 1}`;
        list.push({
          angle,
          label,
          shortTag,
          url: resolveImageUrl(imgId, 'full'),
        });
      });
    }

    return list;
  }, [currentColorObj, parsedImages]);

  // Current active angle image
  const currentHero = useMemo(() => {
    const match = angleEntries.find((a) => a.angle === selectedAngle);
    if (match) return match;
    return angleEntries[0] || null;
  }, [angleEntries, selectedAngle]);

  const price = product?.priceEtb ?? (product as any)?.price ?? 0;
  const inStock = product?.stockQuantity === undefined || (product?.stockQuantity ?? 0) > 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title || (product as any).name || 'Garment',
      price: price,
      image: currentHero?.url || angleEntries[0]?.url || '',
      size: selectedSize || sizes[0] || 'Standard',
      color: selectedColor || colorNames[0] || 'Standard',
      quantity,
      sku: product.sku || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const filteredRelated = related.filter((p: any) => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-24 bg-slate-200 rounded w-full" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-slate-500 text-lg">Product not found</p>
          <Link to="/shop" className="text-sky-600 mt-4 inline-block font-semibold">← Back to Catalog</Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 mb-6 text-sm font-semibold transition-colors">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {/* Images & Multi-Angle Studio Gallery */}
          <div className="space-y-4">
            {/* Main Stage */}
            <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative group">
              {currentHero?.url ? (
                <img
                  src={currentHero.url}
                  alt={`${product.title} - ${currentHero.label}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Camera size={32} className="opacity-40" />
                  <span className="text-sm">No Image Available</span>
                </div>
              )}

              {/* Floating Angle Badge */}
              {currentHero && (
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/10">
                  <Camera size={13} className="text-sky-400" />
                  <span>{currentHero.label.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Quick Angle Switcher Tabs */}
            {angleEntries.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {angleEntries.map((item) => {
                  const isActive = (currentHero?.angle || 'front') === item.angle;
                  return (
                    <button
                      key={item.angle}
                      type="button"
                      onClick={() => setSelectedAngle(item.angle)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.angle === 'front' && <Camera size={13} />}
                      {item.angle === 'back' && <RefreshCw size={13} />}
                      {item.angle === 'side' && <Layers size={13} />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Thumbnail Preview Row */}
            {angleEntries.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {angleEntries.map((item) => {
                  const isActive = (currentHero?.angle || 'front') === item.angle;
                  return (
                    <button
                      key={item.angle}
                      type="button"
                      onClick={() => setSelectedAngle(item.angle)}
                      className={`aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 transition-all relative group cursor-pointer text-left p-0 ${
                        isActive
                          ? 'border-sky-600 ring-2 ring-sky-500/20 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                      <span className={`absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-black text-center py-0.5 rounded shadow ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900/80 text-slate-200 backdrop-blur-sm'
                      }`}>
                        {item.shortTag}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2.5 py-1 rounded-md">
                  {product.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">SKU: {product.sku || 'ASTU-EXP'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 leading-tight">{product.title}</h1>
              
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-3xl font-black text-sky-700">ETB {price.toLocaleString()}</p>
                {inStock ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
                ) : (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Out of Stock</span>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-slate-600 mt-4 leading-relaxed">{product.description}</p>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Size</label>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((s: string) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          (selectedSize || sizes[0]) === s
                            ? 'border-sky-600 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colorNames.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorNames.map((c: string) => {
                      const colObj = parsedColors.find((p: any) => (typeof p === 'string' ? p : p?.name) === c);
                      const hex = colObj?.hex;
                      const isSelected = (selectedColor || colorNames[0]) === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c);
                            setSelectedAngle('front');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-sky-600 bg-sky-50 text-sky-700 shadow-sm scale-105'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {hex && (
                            <span
                              className="w-3 h-3 rounded-full border border-slate-300 shrink-0 inline-block"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6 flex items-center gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity</label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-1 mt-6">
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={handleAddToCart}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : inStock
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={18} /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} /> Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Info Box */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Truck size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Addis Ababa & Regional</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Express shipping via local couriers</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Guaranteed Quality</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pay on delivery or via Telebirr</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {filteredRelated.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
