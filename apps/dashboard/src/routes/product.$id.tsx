import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useStorefrontProduct, useStorefrontProducts } from '../hooks/useStorefrontProducts';
import { useCart } from '../hooks/useCart';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { ProductCard } from '../components/storefront/ProductCard';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, Check } from 'lucide-react';

export const Route = createFileRoute('/product/$id')({
  component: ProductDetailComponent,
});

function ProductDetailComponent() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useStorefrontProduct(id);
  const { data: related = [] } = useStorefrontProducts(product?.category);
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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

  const sizes: string[] = (product.sizes || ['S', 'M', 'L', 'XL']).map((s: any) => typeof s === 'string' ? s : s?.label || 'Standard');
  const colors: string[] = (product.colors || ['Standard']).map((c: any) => typeof c === 'string' ? c : c?.name || 'Standard');
  const images = product.images && product.images.length > 0 ? product.images : [(product as any).image].filter(Boolean);
  const price = product.priceEtb ?? (product as any).price ?? 0;
  const inStock = product.stockQuantity === undefined || product.stockQuantity > 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title || (product as any).name || 'Garment',
      price: price,
      image: images[0] || '',
      size: selectedSize || sizes[0] || 'Standard',
      color: selectedColor || colors[0] || 'Standard',
      quantity,
      sku: product.sku || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const filteredRelated = related.filter((p: any) => p.id !== product.id).slice(0, 4);

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 mb-6 text-sm font-semibold transition-colors">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {/* Images */}
          <div>
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
              {images.length > 0 ? (
                <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No Image Available</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {images.slice(0, 4).map((img: string, i: number) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
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
                <span className="text-xs text-slate-400 font-mono">SKU: {product.sku || 'R2-EXP'}</span>
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
              {colors.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c: string) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          (selectedColor || colors[0]) === c
                            ? 'border-sky-600 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
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
