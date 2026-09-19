import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useStorefrontProducts } from '../hooks/useStorefrontProducts';
import { ProductCard } from '../components/storefront/ProductCard';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { Search, PackageOpen } from 'lucide-react';

export const Route = createFileRoute('/shop')({
  component: ShopComponent,
});

function ShopComponent() {
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const { data: products = [], isLoading } = useStorefrontProducts(category || undefined, search || undefined);

  const categories = [
    { id: '', name: 'All Products' },
    { id: 'rtw', name: 'Ready-to-Wear' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'outerwear', name: 'Outerwear' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'footwear', name: 'Footwear' },
  ];

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ASTU Express Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse our full range of Ethiopian fashion, apparel, and merchandise
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  category === cat.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200 animate-pulse">
                <div className="aspect-square bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
            <PackageOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-semibold text-lg">No products match your criteria</p>
            <p className="text-sm text-slate-400 mt-1">Try selecting a different category or clearing search</p>
            {(category || search) && (
              <button
                onClick={() => { setCategory(''); setSearch(''); }}
                className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
