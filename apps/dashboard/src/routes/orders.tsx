import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE, type OrderTrackingDetails } from '@astu/shared';
import {
  Package,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Box,
} from 'lucide-react';

export const Route = createFileRoute('/orders')({
  validateSearch: (search: Record<string, unknown>): { q?: string; tracking?: string; email?: string } => ({
    q: typeof search.q === 'string' ? search.q : typeof search.tracking === 'string' ? search.tracking : typeof search.email === 'string' ? search.email : undefined,
    tracking: typeof search.tracking === 'string' ? search.tracking : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: OrdersComponent,
});

function OrdersComponent() {
  const searchParams = useSearch({ from: '/orders' });
  const initialQuery = searchParams.q || '';

  const [query, setQuery] = useState(initialQuery);
  const [trackedOrder, setTrackedOrder] = useState<OrderTrackingDetails | null>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearchInternal(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchInternal = async (searchStr: string) => {
    const clean = searchStr.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setTrackedOrder(null);
    setOrdersList([]);
    setSearched(true);
    setReceiptSuccess(false);

    try {
      if (clean.includes('@')) {
        // Customer email search -> list customer's full order history
        const result = await apiClient.listOrders({ email: clean });
        if (result.success && result.data) {
          setOrdersList(result.data);
          if (result.data.length === 1 && result.data[0].trackingNumber) {
            // If exactly one order found, auto-fetch full tracking timeline
            const singleTrack = await apiClient.trackOrder(result.data[0].trackingNumber);
            if (singleTrack.success && singleTrack.data) {
              setTrackedOrder(singleTrack.data);
            }
          }
        } else {
          setError(result.error || 'No orders found matching this email address.');
        }
      } else {
        // Tracking number or order ID search -> track directly
        const trackRes = await apiClient.trackOrder(clean);
        if (trackRes.success && trackRes.data) {
          setTrackedOrder(trackRes.data);
        } else {
          // Fallback to general list search if track endpoint doesn't find it
          const listRes = await apiClient.listOrders({ trackingNumber: clean, query: clean });
          if (listRes.success && listRes.data && listRes.data.length > 0) {
            setOrdersList(listRes.data);
          } else {
            setError(trackRes.error || `No shipment found for tracking number or order ID "${clean}". Please verify your reference number.`);
          }
        }
      }
    } catch (err: any) {
      console.error('Order tracking search error:', err);
      setError(err.message || 'Unable to retrieve tracking information at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchInternal(query);
  };

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReceipt = async (orderId: string) => {
    setConfirmingReceipt(true);
    try {
      const res = await apiClient.confirmOrderReceipt(orderId);
      if (res.success) {
        setReceiptSuccess(true);
        if (trackedOrder) {
          setTrackedOrder({
            ...trackedOrder,
            status: 'delivered',
            confirmedReceiptAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to confirm receipt:', err);
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') {
      return {
        label: 'Delivered',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeColor: 'bg-emerald-500',
        icon: CheckCircle2,
      };
    }
    if (s === 'shipped') {
      return {
        label: 'In Transit / Dispatched',
        bg: 'bg-sky-100 text-sky-800 border-sky-300',
        badgeColor: 'bg-sky-500',
        icon: Truck,
      };
    }
    if (s === 'processing') {
      return {
        label: 'At Addis Atelier / Processing',
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        badgeColor: 'bg-indigo-500',
        icon: Package,
      };
    }
    if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeColor: 'bg-rose-500',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Order Confirmed / Pending',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeColor: 'bg-amber-500',
      icon: Clock,
    };
  };

  return (
    <StorefrontLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title & Introduction */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">
            <Truck size={15} />
            <span>Ethiopian Logistics & Nationwide Parcel Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Track Package & Order History
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Enter your <strong>Tracking Number</strong> (e.g. <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">ETH-TRK-...</span>), <strong>Order ID</strong>, or <strong>Customer Email</strong> to check live dispatch milestones, hub packaging, and delivery confirmation.
          </p>
        </div>

        {/* Universal Search Form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Tracking Number (e.g. ETH-TRK-749201A) or customer email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Searching DB...</span>
                </>
              ) : (
                <>
                  <Truck size={16} />
                  <span>Track Package</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Quick Tips:</span>
            <span>Paste your tracking number from checkout or SMS confirmation to view live courier status.</span>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex items-start gap-3 text-rose-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <h4 className="font-bold text-sm">Package Lookup Notice</h4>
              <p className="text-xs mt-0.5 text-rose-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* 1. SINGLE DETAILED TRACKED ORDER VIEW */}
        {trackedOrder && (
          <div className="space-y-6">
            {/* Top Tracking Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Tracking Number
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTracking(trackedOrder.trackingNumber)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 transition-colors"
                      title="Copy tracking number"
                    >
                      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900">
                    {trackedOrder.trackingNumber}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <Calendar size={13} />
                    <span>Order Placed: {new Date(trackedOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-2">
                  {(() => {
                    const badge = getStatusBadge(trackedOrder.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon size={14} />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                  <div className="text-xs text-slate-500">
                    <span>Carrier: </span>
                    <strong className="text-slate-800 font-bold">{trackedOrder.carrier || 'Ethiopian Postal Service (EMS)'}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Destination & Estimated Time */}
              <div className="grid sm:grid-cols-3 gap-4 py-5 border-b border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Delivery Address:</span>
                    <span className="font-bold text-slate-800 leading-snug block">{trackedOrder.shippingAddress || 'Addis Ababa, Ethiopia'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Truck size={16} className="text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Estimated Delivery:</span>
                    <span className="font-bold text-slate-800 block">
                      {trackedOrder.deliveredAt
                        ? `Delivered on ${new Date(trackedOrder.deliveredAt).toLocaleDateString()}`
                        : trackedOrder.estimatedDelivery || 'Within 2-3 Business Days'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CreditCard size={16} className="text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Payment Status:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${trackedOrder.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-bold text-slate-800 capitalize">{trackedOrder.paymentStatus || 'Unpaid'}</span>
                      <span className="text-slate-400 font-normal">({trackedOrder.paymentMethod || 'COD'})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE TRACKING TIMELINE / STEPPER */}
              <div className="pt-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Shipment Tracking Journey
                </h3>
                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {trackedOrder.timeline?.map((step, idx) => {
                    return (
                      <div key={idx} className="relative group">
                        {/* Step Marker */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            step.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : step.current
                              ? 'bg-sky-500 border-sky-500 text-white ring-4 ring-sky-100 shadow-md shadow-sky-500/30 animate-pulse'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {step.completed ? <Check size={14} /> : idx + 1}
                        </div>

                        {/* Step Content */}
                        <div className="ml-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className={`text-sm font-extrabold ${step.completed || step.current ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.title}
                            </h4>
                            {step.timestamp && (
                              <span className="text-[11px] font-medium text-slate-400">
                                {new Date(step.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Receipt Seam for Delivered Orders */}
              {trackedOrder.status?.toLowerCase() === 'delivered' && (
                <div className="mt-8 pt-6 border-t border-slate-100 bg-emerald-50/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Package Delivered</h4>
                      <p className="text-xs text-emerald-800">
                        {receiptSuccess || trackedOrder.confirmedReceiptAt
                          ? 'Customer confirmed receipt. Thank you for shopping with ASTU Express!'
                          : 'Did you receive your garments in good condition? Confirm delivery here.'}
                      </p>
                    </div>
                  </div>
                  {!receiptSuccess && !trackedOrder.confirmedReceiptAt && (
                    <button
                      type="button"
                      onClick={() => handleConfirmReceipt(trackedOrder.id)}
                      disabled={confirmingReceipt}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {confirmingReceipt ? 'Confirming...' : 'Confirm I Received This'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Package Contents Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-sky-600" />
                  <span>Items in This Package ({trackedOrder.items?.length || trackedOrder.quantity || 1})</span>
                </h3>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                  Total: ETB {trackedOrder.totalPriceEtb?.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {trackedOrder.items && trackedOrder.items.length > 0 ? (
                  trackedOrder.items.map((it: any, i: number) => {
                    const rawImg = it.image || it.imageUrl;
                    const resolvedImg = resolveImageUrl(rawImg, 'thumb');
                    return (
                      <div key={i} className="py-3.5 flex items-center gap-4">
                        <img
                          src={resolvedImg}
                          alt={it.title || 'Item'}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                          }}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {it.title || it.name || trackedOrder.garmentTitle}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {it.sku && <span className="font-mono">{it.sku}</span>}
                            {it.size && <span>Size: {it.size}</span>}
                            {it.colorName && <span>Color: {it.colorName}</span>}
                            <span>Qty: {it.quantity || 1}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">
                            ETB {((it.priceEtb || it.price || 0) * (it.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{trackedOrder.garmentTitle}</h4>
                      <p className="text-xs text-slate-500">Bespoke tailored garment — Quantity: {trackedOrder.quantity || 1}</p>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      ETB {trackedOrder.totalPriceEtb?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. MULTIPLE ORDERS FOUND (SEARCHED BY EMAIL OR MULTI-MATCH) */}
        {!trackedOrder && ordersList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Found {ordersList.length} Order(s)
              </h2>
              <span className="text-xs text-slate-400">Click any order to inspect live package tracking</span>
            </div>

            {ordersList.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-sky-300 transition-all cursor-pointer"
                  onClick={() => handleSearchInternal(order.trackingNumber || order.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {order.trackingNumber || `Order #${order.id}`}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {order.id}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {order.garmentTitle || 'ASTU Express Garment'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon size={14} /> {badge.label}
                      </span>
                      <p className="text-lg font-black text-sky-700">ETB {order.totalPriceEtb?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <div>
                        <span className="text-slate-400 font-semibold">Destination: </span>
                        <span className="font-bold text-slate-800">{order.shippingAddress || 'Addis Ababa'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Payment: </span>
                        <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition-colors flex items-center gap-1.5"
                    >
                      <span>Track Package Live</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. EMPTY STATE */}
        {searched && !loading && !trackedOrder && ordersList.length === 0 && !error && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Package size={52} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-extrabold text-slate-900">No Package Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              We could not find any order with tracking reference or email "{query}". Please double-check your receipt or SMS confirmation.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/shop"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Browse Shop Catalog
              </Link>
              <button
                type="button"
                onClick={() => { setQuery(''); setSearched(false); }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* 4. DEFAULT HELPER CARDS (BEFORE SEARCH) */}
        {!searched && (
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Nationwide Transit</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track parcels across Addis Ababa, Adama, Hawassa, Bahir Dar, and Dire Dawa with real-time checkpoint timestamps.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Delivery Confirmation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm receipt directly from your phone once courier completes handover to release merchant escrow funds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                <Box size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Atelier Quality Check</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every traditional Habesha Kemis and Shemma jacket is verified for weaving craftsmanship prior to dispatch.
              </p>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
