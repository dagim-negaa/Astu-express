import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '@astu/shared';
import {
  Ticket,
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  User,
  ShieldCheck,
} from 'lucide-react';

export const Route = createFileRoute('/orders')({
  validateSearch: (search: Record<string, unknown>): { email?: string; q?: string } => ({
    email: typeof search.email === 'string' ? search.email : typeof search.q === 'string' ? search.q : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: TicketHistoryComponent,
});

function TicketHistoryComponent() {
  const searchParams = useSearch({ from: '/orders' });
  const { customer, isLoggedIn } = useCustomerAuth();

  const [emailInput, setEmailInput] = useState('');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchTicketsForEmail = useCallback(async (email: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await apiClient.listOrders({ email: cleanEmail });
      if (res.success && res.data) {
        setOrdersList(res.data);
      } else {
        setOrdersList([]);
        setError(res.error || `No purchase tickets found under "${cleanEmail}".`);
      }
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
      setError(err.message || 'Unable to retrieve tickets at this moment.');
      setOrdersList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch tickets if customer is logged in
  useEffect(() => {
    if (isLoggedIn && customer?.email) {
      setEmailInput(customer.email);
      fetchTicketsForEmail(customer.email);
    } else if (searchParams.email) {
      setEmailInput(searchParams.email);
      fetchTicketsForEmail(searchParams.email);
    }
  }, [isLoggedIn, customer?.email, searchParams.email, fetchTicketsForEmail]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      fetchTicketsForEmail(emailInput.trim());
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmReceipt = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await apiClient.confirmOrderReceipt(orderId);
      if (res.success) {
        // Update local list
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: 'delivered', confirmedReceiptAt: new Date().toISOString() }
              : o
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to confirm receipt:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') {
      return {
        label: 'Delivered',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
      };
    }
    if (s === 'shipped') {
      return {
        label: 'In Transit / Dispatched',
        bg: 'bg-sky-100 text-sky-800 border-sky-300',
        icon: Truck,
      };
    }
    if (s === 'processing') {
      return {
        label: 'At Atelier / Processing',
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Package,
      };
    }
    if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Order Confirmed',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Clock,
    };
  };

  return (
    <StorefrontLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">
            <Ticket size={15} />
            <span>Customer Purchase Tickets & Invoices</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ticket History
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Review your placed orders, tailored garment tickets, payment invoices, and click through to live nationwide delivery tracking.
          </p>
        </div>

        {/* Logged-In Customer Banner OR Guest Email Lookup */}
        {isLoggedIn && customer ? (
          <div className="bg-white p-5 rounded-3xl border border-sky-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {customer.name}
                  </span>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Logged In
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing tickets for account: <strong className="text-slate-700 font-mono">{customer.email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchTicketsForEmail(customer.email)}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Tickets</span>
              </button>
              <Link
                to="/track"
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Truck size={13} />
                <span>Track By Number</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Guest Ticket Lookup
              </span>
              <Link
                to="/auth"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>Have an account? Sign in for automatic sync</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter the email address used during checkout..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !emailInput.trim()}
                className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Loading Tickets...</span>
                  </>
                ) : (
                  <>
                    <Ticket size={16} />
                    <span>Find My Tickets</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex items-start gap-3 text-rose-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <h4 className="font-bold text-sm">Ticket History Notice</h4>
              <p className="text-xs mt-0.5 text-rose-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw size={36} className="animate-spin mx-auto text-sky-600 mb-3" />
            <p className="text-sm font-bold text-slate-700">Retrieving tickets from ASTU Express database...</p>
          </div>
        )}

        {/* Ticket List View */}
        {!loading && ordersList.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Showing {ordersList.length} Ticket{ordersList.length === 1 ? '' : 's'}
              </h2>
              <span className="text-xs text-slate-400">Click Track Package to inspect live courier progress</span>
            </div>

            {ordersList.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              const hasConfirmed = Boolean(order.confirmedReceiptAt);
              const isDelivered = order.status?.toLowerCase() === 'delivered';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:border-sky-300 transition-all space-y-5"
                >
                  {/* Top Bar: Ticket Ref, Status, Price */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Ticket Reference
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.trackingNumber || order.id, order.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 transition-colors"
                          title="Copy tracking reference"
                        >
                          {copiedId === order.id ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedId === order.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-slate-900">
                        {order.trackingNumber || `ORD-${order.id.slice(0, 8)}`}
                      </h3>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <Calendar size={13} />
                        <span>
                          Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right space-y-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon size={14} />
                        <span>{badge.label}</span>
                      </span>
                      <p className="text-2xl font-black text-sky-700">
                        ETB {order.totalPriceEtb?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Delivery & Payment Metadata */}
                  <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-400 block font-semibold">Delivery Address:</span>
                        <span className="font-bold text-slate-800 leading-tight">
                          {order.shippingAddress || 'Addis Ababa, Ethiopia'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CreditCard size={15} className="text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-400 block font-semibold">Payment Method:</span>
                        <span className="font-bold text-slate-800 capitalize">
                          {order.paymentMethod || 'Cash on Delivery'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Garment / Items Breakdown */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Garment Items ({order.items?.length || order.quantity || 1})
                    </span>

                    <div className="divide-y divide-slate-100">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it: any, idx: number) => {
                          const rawImg = it.image || it.imageUrl;
                          const resolvedImg = resolveImageUrl(rawImg, 'thumb');
                          return (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolvedImg}
                                  alt={it.title || 'Item'}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                />
                                <div className="truncate">
                                  <h4 className="text-sm font-bold text-slate-900 truncate">
                                    {it.title || it.name || order.garmentTitle}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {it.size && <span>Size: {it.size}</span>}
                                    {it.colorName && <span>Color: {it.colorName}</span>}
                                    <span>Qty: {it.quantity || 1}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm font-black text-slate-800 shrink-0">
                                ETB {((it.priceEtb || it.price || 0) * (it.quantity || 1)).toLocaleString()}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">
                            {order.garmentTitle || 'ASTU Express Garment'}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            ETB {order.totalPriceEtb?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    {/* Confirm receipt button if delivered */}
                    {isDelivered && !hasConfirmed ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmReceipt(order.id)}
                        disabled={confirmingId === order.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <ShieldCheck size={14} />
                        <span>
                          {confirmingId === order.id ? 'Confirming...' : 'Confirm Delivery Receipt'}
                        </span>
                      </button>
                    ) : hasConfirmed ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        <span>Delivery Confirmed</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-slate-600">{order.status}</strong>
                      </span>
                    )}

                    {/* Primary Button: Track Live Shipment */}
                    <Link
                      to="/track"
                      search={{ q: order.trackingNumber || order.id }}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Truck size={15} />
                      <span>Track Live Shipment</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && ordersList.length === 0 && !error && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Ticket size={52} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-extrabold text-slate-900">No Tickets Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              We did not find any purchase tickets or placed orders for this account. Discover our latest Ethiopian ready-to-wear and traditional collections.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/shop"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <ShoppingBag size={14} />
                <span>Browse Shop Catalog</span>
              </Link>
            </div>
          </div>
        )}

        {/* Guide when guest has not searched yet */}
        {!isLoggedIn && !hasSearched && (
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
                <Ticket size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Digital Order Tickets</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access your past invoices, garment order summaries, item specifications, and delivery destinations in one unified portal.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Instant Customer Sync</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log in to your customer account to automatically synchronize and load all orders placed across all devices.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">1-Click Live Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Each ticket connects directly to our nationwide courier tracking system to check real-time road milestones.
              </p>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
