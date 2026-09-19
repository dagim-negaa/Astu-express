import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { apiClient } from '../lib/api';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { CheckCircle2, Truck, ShieldCheck, CreditCard, Banknote, Smartphone, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/checkout')({
  component: CheckoutComponent,
});

function CheckoutComponent() {
  const { items, totalPrice, clearCart } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: (customer?.phone && customer.phone !== 'N/A') ? customer.phone : '',
    address: '',
    city: 'Addis Ababa',
    paymentMethod: 'cash_on_delivery',
    notes: '',
  });

  // Automatically take customer data from DB/session when logged in
  useEffect(() => {
    if (isLoggedIn && customer) {
      setForm((prev) => ({
        ...prev,
        name: customer.name || prev.name,
        email: customer.email || prev.email,
        phone: (customer.phone && customer.phone !== 'N/A') ? customer.phone : prev.phone,
      }));
    }
  }, [isLoggedIn, customer]);

  if (items.length === 0 && !success) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-slate-500 text-lg">Your cart is empty</p>
          <Link to="/shop" className="text-sky-600 mt-4 inline-block font-semibold">← Back to Catalog</Link>
        </div>
      </StorefrontLayout>
    );
  }

  if (success) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-sm text-slate-600 mb-6">
            Thank you for shopping with ASTU Express. Your order has been placed into our shipping system.
          </p>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-6 text-left space-y-3">
            {trackingNumber && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center mb-4">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-widest block">Official Shipment Tracking Number</span>
                <span className="text-2xl font-black font-mono text-sky-900 tracking-wider my-1 block select-all">{trackingNumber}</span>
                <p className="text-xs text-sky-700">Save this tracking number to follow your package across Ethiopian logistics centers.</p>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">Order ID:</span>
              <span className="text-xs font-mono font-bold text-slate-900">{orderId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">Customer:</span>
              <span className="text-xs font-semibold text-slate-900">{form.name} ({form.email})</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500">Shipping To:</span>
              <span className="text-xs font-semibold text-slate-900">{form.address}, {form.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Total Price:</span>
              <span className="text-sm font-black text-sky-700">ETB {totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Link
              to="/orders"
              search={{ q: trackingNumber || orderId } as any}
              className="px-6 py-3 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-500 transition-colors shadow-sm flex items-center gap-2"
            >
              <Truck size={16} />
              <span>Track Package Live</span>
            </Link>
            <Link
              to="/"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const customerName = (isLoggedIn && customer?.name) ? customer.name : form.name.trim();
      const customerEmail = (isLoggedIn && customer?.email) ? customer.email.trim().toLowerCase() : form.email.trim().toLowerCase();
      const customerPhone = form.phone.trim() || (customer?.phone && customer.phone !== 'N/A' ? customer.phone : '+251 91 123 4567');

      if (!customerName || !customerEmail) {
        setError('Please sign in or provide your name and email to proceed.');
        setLoading(false);
        return;
      }

      const firstItem = items[0];
      const result = await apiClient.createOrder({
        customerName,
        customerEmail,
        customerPhone,
        items: items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          title: item.title,
          priceEtb: item.price,
          quantity: item.quantity,
          size: item.size,
          colorName: item.color,
          image: item.image,
        })),
        garmentTitle: items.map((i) => i.title).join(', '),
        garmentSku: firstItem?.sku || 'R2-EXP',
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalPriceEtb: totalPrice,
        paymentMethod:
          form.paymentMethod === 'telebirr'
            ? 'Telebirr'
            : form.paymentMethod === 'cbe_birr'
            ? 'CBE Birr'
            : 'Cash on Delivery',
        shippingAddress: `${form.address}, ${form.city}, Ethiopia`,
        orderSource: 'web',
      });

      if (result.success && result.data) {
        setOrderId(result.data.id);
        setTrackingNumber((result.data as any).trackingNumber || '');
        setSuccess(true);
        clearCart();
      } else {
        setError(result.error || 'Failed to place order. Please check required fields.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Checkout & Ethiopian Delivery</h1>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Shipping & Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Truck size={18} className="text-sky-600" /> Delivery Details
              </h2>

              {/* Verified Logged-in Customer Identity Card */}
              {isLoggedIn && customer ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-base shadow-sm">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{customer.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Logged-In Customer
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{customer.email}</span>
                          {customer.phone && customer.phone !== 'N/A' && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-700">{customer.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200/60 shadow-xs self-start sm:self-auto">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Account Auto-Loaded from DB</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid sm:grid-cols-2 gap-4">
                {/* When NOT logged in, ask for name & email */}
                {!isLoggedIn && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="e.g. Abebe Bikila"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="abebe@example.com"
                      />
                    </div>
                  </>
                )}

                {/* If logged in but phone is missing, or if guest */}
                {(!isLoggedIn || !customer?.phone || customer.phone === 'N/A') && (
                  <div className={isLoggedIn ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number (Ethiopia) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="+251 91 123 4567"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Needed for dispatch courier contact</span>
                  </div>
                )}

                <div className={isLoggedIn && customer?.phone && customer.phone !== 'N/A' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City / Region *</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Addis Ababa">Addis Ababa (Bole, Piassa, Merkato, Kazanchis, etc.)</option>
                    <option value="Adama / Nazret">Adama / Nazret</option>
                    <option value="Hawassa">Hawassa</option>
                    <option value="Bahir Dar">Bahir Dar</option>
                    <option value="Dire Dawa">Dire Dawa</option>
                    <option value="Gondar">Gondar</option>
                    <option value="Bishoftu">Bishoftu / Debre Zeyit</option>
                    <option value="Mekelle">Mekelle</option>
                    <option value="Jimma">Jimma</option>
                    <option value="Other Regional Center">Other Regional Hub</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Specific Street / House / Landmark Address *</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Bole Sub-city, Woreda 03, Near Edna Mall"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Ethiopian Payment Method
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'cash_on_delivery',
                    title: 'Cash on Delivery',
                    desc: 'Pay cash to delivery courier',
                    icon: Banknote,
                    badge: 'Recommended',
                  },
                  {
                    id: 'telebirr',
                    title: 'Telebirr',
                    desc: 'Fast mobile payment',
                    icon: Smartphone,
                    badge: 'Instant',
                  },
                  {
                    id: 'cbe_birr',
                    title: 'CBE Birr',
                    desc: 'Commercial Bank transfer',
                    icon: CreditCard,
                    badge: 'Bank Direct',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <label
                      key={m.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        form.paymentMethod === m.id
                          ? 'border-sky-600 bg-sky-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Icon size={20} className={form.paymentMethod === m.id ? 'text-sky-600' : 'text-slate-500'} />
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {m.badge}
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.id}
                          checked={form.paymentMethod === m.id}
                          onChange={() => setForm({ ...form, paymentMethod: m.id })}
                          className="sr-only"
                        />
                        <div className="text-sm font-bold text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{m.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">Review Order</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between items-center text-xs">
                  <div className="truncate mr-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-slate-400 block">Qty: {item.quantity} • {item.size}</span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">
                    ETB {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">ETB {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-bold">Standard Courier Included</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-xl font-black text-sky-700">ETB {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Processing Order...' : 'Confirm & Place Order'}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Official ASTU Express Ethiopian mini ERP order system
            </p>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  );
}
