import { createFileRoute, Link } from '@tanstack/react-router';
import { useStorefrontProducts } from '../hooks/useStorefrontProducts';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { ProductCard } from '../components/storefront/ProductCard';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { Truck, ShieldCheck, Clock, ArrowRight, Package, Sparkles, UserCheck } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: products = [], isLoading } = useStorefrontProducts();
  const { customer, isLoggedIn } = useCustomerAuth();
  const featured = products.filter((p: any) => p.isFeatured).slice(0, 4);
  const recent = products.slice(0, 8);

  return (
    <StorefrontLayout>
      {/* Hero Banner */}
      <section className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
        {/* Background image with contrast overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80"
            alt="Ethiopian fashion boutique background"
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/35" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-2xl">
            {isLoggedIn && customer ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-semibold mb-4">
                <UserCheck size={14} className="text-emerald-400" />
                <span>Welcome back, <strong className="text-white font-bold">{customer.name}</strong></span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-medium mb-4">
                <Sparkles size={14} className="text-sky-400" /> Ethiopian Shipping Center &amp; Mini ERP
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
              {isLoggedIn && customer ? (
                <>Welcome back, <span className="text-sky-400">{customer.name}</span> — Ready for Express Delivery</>
              ) : (
                <>Express Shipping &amp; Premium Quality, Delivered Across Ethiopia</>
              )}
            </h1>

            <p className="text-base text-slate-300 mb-8 leading-relaxed">
              {isLoggedIn && customer
                ? `Logged in as ${customer.name} (${customer.email}). Explore handcrafted Ethiopian garments, track shipments live, and enjoy expedited dispatch.`
                : 'Order authentic Ethiopian garments, ready-to-wear fashion, and lifestyle essentials. Seamless local delivery via Telebirr, CBE Birr, and Cash on Delivery.'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                Shop Catalog <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
            <div className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Nationwide Ethiopian Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">Addis Ababa same-day delivery & fast regional couriers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Secure Ethiopian Payments</h4>
                <p className="text-xs text-slate-500 mt-0.5">Pay conveniently with Telebirr, CBE Birr, or Cash on Delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Live Order Tracking</h4>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status updates from warehouse to doorstep</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Explore Categories</h2>
            <p className="text-sm text-slate-500 mt-0.5">Browse curated Ethiopian garments and accessories</p>
          </div>
          <Link to="/shop" className="text-sky-600 text-sm font-semibold hover:text-sky-700">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { id: 'rtw', name: 'Ready-to-Wear', count: 'Modern styles' },
            { id: 'traditional', name: 'Traditional', count: 'Habesha Kemis' },
            { id: 'outerwear', name: 'Outerwear', count: 'Jackets & Coats' },
            { id: 'accessories', name: 'Accessories', count: 'Leather & Crafts' },
            { id: 'footwear', name: 'Footwear', count: 'Boots & Shoes' },
          ].map((cat) => (
            <Link
              key={cat.id}
              to="/shop"
              className="bg-white rounded-md p-4 text-center border border-slate-200"
            >
              <div className="text-[11px] font-mono font-bold uppercase text-slate-500 mb-1 tracking-wider">{cat.id}</div>
              <div className="text-sm font-bold text-slate-900">{cat.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{cat.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Handpicked</span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Featured Garments</h2>
            </div>
            <Link to="/shop" className="text-sky-600 text-sm font-semibold hover:text-sky-700">
              Browse More →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Catalog Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">New Arrivals</span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Latest in Stock</h2>
          </div>
          <Link to="/shop" className="text-sky-600 text-sm font-semibold hover:text-sky-700">
            View All Catalog ({products.length}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200 animate-pulse">
                <div className="aspect-square bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No products currently available</p>
            <p className="text-xs text-slate-400 mt-1">Please check back soon for our latest Ethiopian collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recent.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
