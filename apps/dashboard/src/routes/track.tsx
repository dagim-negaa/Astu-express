import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE, type OrderTrackingDetails } from '@astu/shared';
import {
  Truck,
  Search,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Box,
  Ticket,
  ArrowRight,
} from 'lucide-react';

export const Route = createFileRoute('/track')({
  validateSearch: (search: Record<string, unknown>): { q?: string; tracking?: string } => ({
    q: typeof search.q === 'string' ? search.q : typeof search.tracking === 'string' ? search.tracking : undefined,
    tracking: typeof search.tracking === 'string' ? search.tracking : undefined,
  }),
  component: TrackOrderComponent,
});

function TrackOrderComponent() {
  const searchParams = useSearch({ from: '/track' });
  const initialQuery = searchParams.q || searchParams.tracking || '';

  const [query, setQuery] = useState(initialQuery);
  const [trackedOrder, setTrackedOrder] = useState<OrderTrackingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleTrackInternal(initialQuery);
    }
  }, [initialQuery]);

  const handleTrackInternal = async (searchStr: string) => {
    const clean = searchStr.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setTrackedOrder(null);
    setSearched(true);
    setReceiptSuccess(false);

    try {
      // 1. Try direct tracking endpoint by tracking number or order ID
      const trackRes = await apiClient.trackOrder(clean);
      if (trackRes.success && trackRes.data) {
        setTrackedOrder(trackRes.data);
      } else {
        // Fallback: search via listOrders with trackingNumber or query
        const listRes = await apiClient.listOrders({ trackingNumber: clean, query: clean });
        if (listRes.success && listRes.data && listRes.data.length > 0) {
          const first = listRes.data[0];
          const detailed = await apiClient.trackOrder(first.trackingNumber || first.id);
          if (detailed.success && detailed.data) {
            setTrackedOrder(detailed.data);
          } else {
            setError(`Shipment found for "${clean}", but tracking timeline details are unavailable.`);
          }
        } else {
          setError(
            trackRes.error ||
              `No shipment record found for tracking reference "${clean}". Please verify the number on your receipt or SMS notification.`
          );
        }
      }
    } catch (err: any) {
      console.error('Track order error:', err);
      setError(err.message || 'Unable to retrieve tracking information at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackInternal(query);
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
      console.error('Failed to confirm delivery receipt:', err);
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') {
      return {
        label: 'Delivered to Customer',
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
        label: 'Order Cancelled',
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeColor: 'bg-rose-500',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Order Confirmed / Pending Dispatch',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeColor: 'bg-amber-500',
      icon: Clock,
    };
  };

  return (
    <StorefrontLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">
            <Truck size={15} />
            <span>ASTU Express Nationwide Logistics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Track Order & Live Shipment
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Enter your <strong>Tracking Number</strong> (e.g.{' '}
            <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              ETH-TRK-...
            </span>
            ) or <strong>Order ID</strong> to inspect real-time courier checkpoints, departure hubs, and confirm handover.
          </p>
        </div>

        {/* Tracking Input Card */}
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Tracking Number (e.g. ETH-TRK-749201A) or Order ID..."
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
                  <span>Locating Package...</span>
                </>
              ) : (
                <>
                  <Truck size={16} />
                  <span>Track Package</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="text-slate-400">
              Need to see all your previous orders? Check your{' '}
              <Link to="/orders" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1">
                <Ticket size={12} />
                Ticket History
              </Link>
            </span>
            <span className="text-slate-400">Supports all Ethiopian domestic courier routes</span>
          </div>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex items-start gap-3 text-rose-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <h4 className="font-bold text-sm">Tracking Lookup Notice</h4>
              <p className="text-xs mt-0.5 text-rose-700 leading-relaxed">{error}</p>
              <div className="mt-2 flex gap-3">
                <Link
                  to="/orders"
                  className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
                >
                  <Ticket size={13} />
                  <span>Lookup via Ticket History</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Tracking View */}
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
                    <span>
                      Order Placed:{' '}
                      {new Date(trackedOrder.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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
                    <span>Courier: </span>
                    <strong className="text-slate-800 font-bold">
                      {trackedOrder.carrier || 'Ethiopian Postal Service (EMS) / ASTU Logistics'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="grid sm:grid-cols-3 gap-4 py-5 border-b border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Delivery Destination:</span>
                    <span className="font-bold text-slate-800 leading-snug block">
                      {trackedOrder.shippingAddress || 'Addis Ababa, Ethiopia'}
                    </span>
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
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          trackedOrder.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 capitalize">
                        {trackedOrder.paymentStatus || 'Unpaid'}
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({trackedOrder.paymentMethod || 'Cash on Delivery'})
                      </span>
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
                            <h4
                              className={`text-sm font-extrabold ${
                                step.completed || step.current ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
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

              {/* Confirm Receipt Action for Delivered Shipments */}
              {trackedOrder.status?.toLowerCase() === 'delivered' && (
                <div className="mt-8 pt-6 border-t border-slate-100 bg-emerald-50/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Package Delivered</h4>
                      <p className="text-xs text-emerald-800">
                        {receiptSuccess || trackedOrder.confirmedReceiptAt
                          ? 'Customer confirmed delivery receipt. Thank you for choosing ASTU Express!'
                          : 'Have you received your items in good order? Confirm delivery here.'}
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
                      {confirmingReceipt ? 'Confirming Handover...' : 'Confirm I Received This'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Items in Package */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-sky-600" />
                  <span>Items in This Shipment ({trackedOrder.items?.length || trackedOrder.quantity || 1})</span>
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
                      <p className="text-xs text-slate-500">
                        Bespoke tailored garment — Quantity: {trackedOrder.quantity || 1}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      ETB {trackedOrder.totalPriceEtb?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  to="/orders"
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5"
                >
                  <span>View All Tickets in Ticket History</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Informational Cards for New Visitors */}
        {!searched && (
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Nationwide Hub Network</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check delivery milestones across Addis Ababa, Adama, Hawassa, Bahir Dar, and Dire Dawa with real-time timestamped events.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Delivery Escrow Assurance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm receipt directly from your mobile device once the courier delivers your package safely to your doorstep.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                <Box size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Live SMS & Dispatch</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every stage from atelier hand-finishing to road dispatch is recorded with courier driver assignment and tracking references.
              </p>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
