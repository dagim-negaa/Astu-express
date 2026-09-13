import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { apiClient } from '../lib/api';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { Package, Search, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/orders')({
  component: OrdersComponent,
});

function OrdersComponent() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await apiClient.listOrders({ email });
      setOrders(result.data || []);
      setSearched(true);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') return { label: 'Delivered', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
    if (s === 'shipped') return { label: 'In Transit / Shipped', bg: 'bg-sky-100 text-sky-800 border-sky-200', icon: Truck };
    if (s === 'processing') return { label: 'Processing at Hub', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Package };
    if (s === 'cancelled') return { label: 'Cancelled', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertCircle };
    return { label: 'Pending Review', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
  };

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Track Ethiopian Shipments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your customer email address to inspect live order delivery status and package tracking.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Enter customer email (e.g. abebe@example.com)..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Searching...' : 'Track Orders'}
            </button>
          </div>
        </form>

        {searched && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <Package size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
            <p className="text-sm text-slate-500 mt-1">We could not find any orders associated with "{email}".</p>
            <Link to="/shop" className="mt-4 inline-block text-xs font-bold text-sky-600 hover:underline">
              Browse Catalog
            </Link>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Found {orders.length} Order(s)</h2>
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              return (
                <div key={order.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">Order #{order.id}</span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">{order.garmentTitle || 'R2 Express Garment'}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon size={14} /> {badge.label}
                      </span>
                      <p className="text-lg font-black text-sky-700 mt-2">ETB {order.totalPriceEtb?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-4 grid sm:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-semibold">Payment Method:</span>
                      <span className="font-bold text-slate-800">{order.paymentMethod || 'Cash on Delivery'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Destination:</span>
                      <span className="font-bold text-slate-800 truncate block">{order.shippingAddress || 'Addis Ababa, Ethiopia'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Order Source:</span>
                      <span className="font-bold text-slate-800 uppercase">{order.orderSource || 'Web'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
