import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useAdminStore, type AdminOrder } from '../../store/AdminStore';
import { StatusPill } from '../../components/ui/StatusPill';
import { Drawer } from '../../components/ui/Drawer';
import { PackingSlipModal } from '../../components/ui/PackingSlipModal';
import {
  ShoppingBag,
  Eye,
  Printer,
  CheckCircle2,
  Truck,
  Plus,
  Smartphone,
  PhoneCall,
  Search,
  Filter,
  MapPin,
  Mail,
  Phone,
  AlertTriangle,
  CreditCard,
  Banknote,
  Package,
  Store,
  Check,
} from 'lucide-react';
import type { OrderStatus } from '@astu/shared';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '@astu/shared';

export const Route = createFileRoute('/admin/orders')({
  component: OrdersComponent,
});

interface OrderItemView {
  productId?: string;
  sku: string;
  title: string;
  priceEtb: number;
  quantity: number;
  size?: string | null;
  colorName?: string | null;
  image?: string | null;
}

function getOrderItems(order: AdminOrder): OrderItemView[] {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it: any) => ({
      productId: it.productId || it.id,
      sku: it.sku || 'ASTU-ATELIER',
      title: it.title || it.name || 'Bespoke Garment',
      priceEtb: Number(it.priceEtb ?? it.price ?? it.unitPrice ?? 0),
      quantity: Number(it.quantity) || 1,
      size: it.size || null,
      colorName: it.colorName || it.color || null,
      image: it.image || it.imageUrl || null,
    }));
  }
  return [
    {
      sku: order.garmentSku || 'ASTU-ATELIER',
      title: order.garmentTitle || 'Bespoke Garment',
      priceEtb: order.quantity > 0 ? Math.round(order.totalPriceEtb / order.quantity) : order.totalPriceEtb,
      quantity: order.quantity || 1,
      size: null,
      colorName: null,
      image: null,
    },
  ];
}

function formatOrderDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function OrdersComponent() {
  const { orders, updateOrderStatus, updateOrderPaymentStatus, addOrder, products, stores } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [packingSlipOrder, setPackingSlipOrder] = useState<AdminOrder | null>(null);

  // Manual New Order Form State
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Mobile Transfer' | 'Cash on Delivery'>('Mobile Transfer');
  const [address, setAddress] = useState('Addis Ababa, Ethiopia');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesChannel = channelFilter === 'all' || (o.orderSource || 'phone') === channelFilter;
      const matchesQuery =
        !searchQuery ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesChannel && matchesQuery;
    });
  }, [orders, statusFilter, channelFilter, searchQuery]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail) return;

    const prod = products.find((p) => p.id === selectedProdId) || products[0];
    const garmentTitle = prod ? prod.title : 'Custom Garment';
    const garmentSku = prod ? prod.sku : 'GAR-999';
    const unitPrice = prod ? prod.priceEtb : 3500;
    const orderStoreId = prod?.storeId || undefined;

    addOrder({
      customerName: custName.trim(),
      customerEmail: custEmail.trim(),
      customerPhone: custPhone.trim() || 'N/A',
      garmentTitle,
      garmentSku,
      quantity: Number(qty) || 1,
      totalPriceEtb: unitPrice * (Number(qty) || 1),
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
      status: 'pending',
      shippingAddress: address.trim() || 'Addis Ababa, Ethiopia',
      orderSource: 'phone',
      storeId: orderStoreId,
    });

    setIsAddOrderOpen(false);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
  };

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    updateOrderStatus(orderId, nextStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  const handleCollectPayment = (orderId: string) => {
    updateOrderPaymentStatus(orderId, 'paid');
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: 'paid' } : null));
    }
  };

  const selectedOrderItems = selectedOrder ? getOrderItems(selectedOrder) : [];
  const selectedOrderStore = selectedOrder?.storeId
    ? stores.find((s) => s.id === selectedOrder.storeId)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#0f172a' }}>
            Orders
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            ASTU Express — Track client commissions, payment statuses, and physical courier dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsAddOrderOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            padding: '0.5rem 0.95rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
        >
          <Plus size={15} /> Record Phone Order
        </button>
      </div>

      {/* Filter Bar: Status Tabs, Channel Selector, and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { label: 'All Orders', val: 'all' },
            { label: 'Pending', val: 'pending' },
            { label: 'Processing', val: 'processing' },
            { label: 'Shipped', val: 'shipped' },
            { label: 'Delivered', val: 'delivered' },
            { label: 'Cancelled', val: 'cancelled' },
          ].map((tab) => {
            const isActive = statusFilter === tab.val;
            return (
              <button
                key={tab.val}
                onClick={() => setStatusFilter(tab.val)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#38bdf8' : '#64748b',
                  borderBottom: isActive ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Channel & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Channel Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={13} color="#0ea5e9" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Channels</option>
              <option value="app">App Orders</option>
              <option value="phone">Phone Orders</option>
            </select>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="#8a7a6a" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search reference, client, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem 0.4rem 2rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.78125rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Streamlined Orders Table — Only Essentials */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Order Pipeline ({filteredOrders.length})</span>
          {(statusFilter !== 'all' || channelFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setChannelFilter('all');
                setSearchQuery('');
              }}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ padding: '3.5rem 1.25rem', textAlign: 'center', color: '#64748b' }}>
            <ShoppingBag size={40} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0ea5e9' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>No orders found.</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              Customer orders placed via the mobile app or booked by phone will appear in this pipeline.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em' }}>Order Ref & Date</th>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em' }}>Fulfillment</th>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const isApp = o.orderSource === 'app';
                  const isCod = o.paymentMethod === 'Cash on Delivery';
                  const isPaid = o.paymentStatus === 'paid';
                  const items = getOrderItems(o);
                  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);

                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s ease' }}>
                      {/* Column 1: Order Ref & Date */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                            #{o.id}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: isApp ? '#eff6ff' : '#fdf4f2',
                              color: isApp ? '#0284c7' : '#8b3224',
                              border: `1px solid ${isApp ? '#bae6fd' : '#fecdd3'}`,
                            }}
                          >
                            {isApp ? <Smartphone size={10} /> : <PhoneCall size={10} />}
                            {isApp ? 'App' : 'Phone'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {formatOrderDate(o.createdAt)}
                        </div>
                      </td>

                      {/* Column 2: Customer */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.1rem' }}>
                          {o.customerPhone || o.customerEmail}
                        </div>
                      </td>

                      {/* Column 3: Payment Status & Method */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                          {isPaid ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                backgroundColor: '#ecfdf5',
                                color: '#065f46',
                                border: '1px solid #a7f3d0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <Check size={11} /> Paid
                            </span>
                          ) : isCod ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                backgroundColor: '#fdf4f2',
                                color: '#8b3224',
                                border: '1px solid #fecdd3',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <Banknote size={11} /> COD · Pay on Handover
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                backgroundColor: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <CreditCard size={11} /> Pending Transfer
                            </span>
                          )}
                          <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>
                            {o.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Fulfillment Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusPill status={o.status} />
                      </td>

                      {/* Column 5: Total Amount */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#8b3224', fontSize: '0.9375rem' }}>
                          ETB {o.totalPriceEtb.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'}
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            }}
                            title="View Full Order Details & Timeline"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => setPackingSlipOrder(o)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #bae6fd',
                              backgroundColor: '#f0f9ff',
                              color: '#0284c7',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(14, 165, 233, 0.08)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                            title="Print Official Courier Packing Slip"
                          >
                            <Printer size={14} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Order Details Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order Dossier #${selectedOrder.id}` : 'Order Dossier'}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Context Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Commission Placed
                </span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  {formatOrderDate(selectedOrder.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: selectedOrder.orderSource === 'app' ? '#eff6ff' : '#fdf4f2',
                    color: selectedOrder.orderSource === 'app' ? '#0284c7' : '#8b3224',
                    border: `1px solid ${selectedOrder.orderSource === 'app' ? '#bae6fd' : '#fecdd3'}`,
                  }}
                >
                  {selectedOrder.orderSource === 'app' ? <Smartphone size={12} /> : <PhoneCall size={12} />}
                  {selectedOrder.orderSource === 'app' ? 'Mobile App Order' : 'Phone / Atelier Walk-in'}
                </span>
              </div>
            </div>

            {/* Atelier Store Attribution */}
            {selectedOrderStore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #bae6fd', fontSize: '0.78125rem' }}>
                <Store size={15} color="#0ea5e9" />
                <div>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>Assigned Hub: </span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedOrderStore.name} ({selectedOrderStore.location})</span>
                </div>
              </div>
            )}

            {/* Payment Dossier Card */}
            <div
              style={{
                backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${selectedOrder.paymentStatus === 'paid' ? '#bbf7d0' : '#fde68a'}`,
                borderRadius: '0.5rem',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: selectedOrder.paymentStatus === 'paid' ? '#166534' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Payment Dossier
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                    color: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#b45309',
                    border: `1px solid ${selectedOrder.paymentStatus === 'paid' ? '#86efac' : '#fcd34d'}`,
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              <div style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Method: </span>
                  <strong>{selectedOrder.paymentMethod}</strong>
                </div>
                {selectedOrder.paymentProvider && (
                  <div>
                    <span style={{ color: '#64748b' }}>Provider: </span>
                    <span>{selectedOrder.paymentProvider}</span>
                  </div>
                )}
                {selectedOrder.paymentTxRef && (
                  <div>
                    <span style={{ color: '#64748b' }}>TX Reference: </span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedOrder.paymentTxRef}</span>
                  </div>
                )}
                <div style={{ marginTop: '0.25rem', fontSize: '1rem', fontWeight: 800, color: '#8b3224' }}>
                  Total: ETB {selectedOrder.totalPriceEtb.toLocaleString()}
                </div>
              </div>

              {/* COD Collection CTA Button */}
              {selectedOrder.paymentMethod === 'Cash on Delivery' && selectedOrder.paymentStatus !== 'paid' && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={15} color="#b45309" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.35 }}>
                      Cash on Delivery order. Collect <strong>ETB {selectedOrder.totalPriceEtb.toLocaleString()}</strong> upon doorstep delivery.
                    </span>
                  </div>
                  <button
                    onClick={() => handleCollectPayment(selectedOrder.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(21, 128, 61, 0.25)',
                    }}
                  >
                    <Check size={14} /> Mark Payment Received
                  </button>
                </div>
              )}

              {/* Digital Payment Confirmation Button */}
              {selectedOrder.paymentMethod !== 'Cash on Delivery' && selectedOrder.paymentStatus !== 'paid' && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #fcd34d' }}>
                  <button
                    onClick={() => handleCollectPayment(selectedOrder.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} /> Confirm Digital Transfer
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic 3-Step Fulfillment Timeline */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e8e2d8', padding: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>
                Client Tracking Timeline ({selectedOrder.paymentMethod === 'Cash on Delivery' ? 'COD Adaptive' : 'Prepaid Digital'})
              </span>

              {selectedOrder.paymentMethod === 'Cash on Delivery' ? (
                /* Scenario A: Cash on Delivery */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Step 1: Order Confirmed */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#15803d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>Step 1: Order Confirmed</div>
                      <div style={{ fontSize: '0.71875rem', color: '#665c52' }}>Atelier received and acknowledged commission.</div>
                    </div>
                  </div>

                  {/* Step 2: Payment (Pay on handover) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {selectedOrder.paymentStatus === 'paid' ? '2' : '2'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>
                        Step 2: Pay upon Handover {selectedOrder.paymentStatus === 'paid' ? '(Collected)' : '(Pending)'}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#665c52' }}>
                        Customer pays in cash or card to courier upon physical arrival.
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Delivered */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: selectedOrder.status === 'delivered' ? '#15803d' : '#e2e8f0',
                        color: selectedOrder.status === 'delivered' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>
                        Step 3: Delivered {selectedOrder.status === 'delivered' ? '(Completed)' : ''}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#665c52' }}>
                        Delivered into client hands and sealed in mobile tracking.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scenario B: Prepaid Digital */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Step 1: Order Confirmed */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#15803d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>Step 1: Order Confirmed</div>
                      <div style={{ fontSize: '0.71875rem', color: '#665c52' }}>Commission booked at atelier.</div>
                    </div>
                  </div>

                  {/* Step 2: Payment Confirmed */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>
                        Step 2: Digital Payment {selectedOrder.paymentStatus === 'paid' ? '(Confirmed)' : '(Pending)'}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#665c52' }}>
                        Settled digitally via Telebirr, CBE, or Chapa gateway.
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Delivered */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: selectedOrder.status === 'delivered' ? '#15803d' : '#e2e8f0',
                        color: selectedOrder.status === 'delivered' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Step 3: Delivered {selectedOrder.status === 'delivered' ? '(Completed)' : ''}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                        Courier delivery confirmed into customer hands.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Shipping Information Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                Client & Destination
              </span>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedOrder.customerName}
              </h4>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78125rem' }}>
                <a
                  href={`tel:${selectedOrder.customerPhone || ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                >
                  <Phone size={13} /> {selectedOrder.customerPhone || 'No phone recorded'}
                </a>
                <a
                  href={`mailto:${selectedOrder.customerEmail}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', textDecoration: 'none' }}
                >
                  <Mail size={13} color="#64748b" /> {selectedOrder.customerEmail}
                </a>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: '#0f172a', fontWeight: 600, marginTop: '0.2rem' }}>
                  <MapPin size={14} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{selectedOrder.shippingAddress}</span>
                </div>
              </div>
            </div>

            {/* Itemized Garments Breakdown */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Itemized Garments ({selectedOrderItems.length})
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b3224' }}>
                  ETB {selectedOrder.totalPriceEtb.toLocaleString()}
                </span>
              </div>

              <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedOrderItems.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      paddingBottom: idx !== selectedOrderItems.length - 1 ? '0.75rem' : '0',
                      borderBottom: idx !== selectedOrderItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    {/* Thumbnail Image or Icon */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {it.image ? (
                        <img
                          src={resolveImageUrl(it.image, 'thumb')}
                          alt={it.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Package size={20} color="#64748b" />
                      )}
                    </div>

                    {/* Garment Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.1rem 0.35rem', borderRadius: '0.2rem' }}>
                          {it.sku}
                        </span>
                        {it.size && (
                          <span style={{ fontSize: '0.6875rem', color: '#0f172a', fontWeight: 600 }}>
                            Size: {it.size}
                          </span>
                        )}
                        {it.colorName && (
                          <span style={{ fontSize: '0.6875rem', color: '#475569' }}>
                            · {it.colorName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#8b3224' }}>
                        ETB {(it.priceEtb * it.quantity).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        ETB {it.priceEtb.toLocaleString()} × {it.quantity}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Subtotal & Delivery Breakdown */}
                <div style={{ marginTop: '0.35rem', paddingTop: '0.65rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Garments Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>ETB {selectedOrder.totalPriceEtb.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Courier Delivery:</span>
                    <span style={{ fontWeight: 700, color: '#15803d' }}>Complimentary (Free)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: '0.35rem', marginTop: '0.15rem', fontSize: '0.875rem', fontWeight: 800, color: '#8b3224' }}>
                    <span>Total Amount:</span>
                    <span>ETB {selectedOrder.totalPriceEtb.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operator Status Transition Controls */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                Operator Pipeline Actions
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                {[
                  { label: 'Mark Processing', status: 'processing' as OrderStatus, icon: CheckCircle2 },
                  { label: 'Mark Shipped / In-Transit', status: 'shipped' as OrderStatus, icon: Truck },
                  { label: 'Mark Delivered', status: 'delivered' as OrderStatus, icon: CheckCircle2 },
                  { label: 'Cancel Order', status: 'cancelled' as OrderStatus, icon: CheckCircle2 },
                ].map((act) => {
                  const isCurrent = selectedOrder.status === act.status;
                  return (
                    <button
                      key={act.status}
                      onClick={() => handleUpdateStatus(selectedOrder.id, act.status)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '0.375rem',
                        border: isCurrent ? '1px solid #0ea5e9' : '1px solid #cbd5e1',
                        backgroundColor: isCurrent ? '#0f172a' : '#ffffff',
                        color: isCurrent ? '#38bdf8' : '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      <act.icon size={13} /> {act.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Print Slip Action Button in Drawer */}
            <button
              onClick={() => {
                setPackingSlipOrder(selectedOrder);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                padding: '0.55rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
            >
              <Printer size={15} /> Print Official Delivery & Packing Slip
            </button>
          </div>
        )}
      </Drawer>

      {/* Record Order Modal */}
      <Drawer isOpen={isAddOrderOpen} onClose={() => setIsAddOrderOpen(false)} title="Record New Customer Order (Phone / Walk-in)">
        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Customer Name *</label>
            <input
              required
              type="text"
              placeholder="Dawit Tadesse"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Email Address *</label>
            <input
              required
              type="email"
              placeholder="dawit@astugarment.et"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Phone Number</label>
            <input
              type="tel"
              placeholder="+251 91 123 4567"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Select Product Item</label>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              {products.length === 0 ? (
                <option value="">No products in catalog (Will record custom item)</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.sku}) - ETB {p.priceEtb.toLocaleString()}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Quantity</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              <option value="Mobile Transfer">Mobile Transfer (Telebirr / CBE Birr)</option>
              <option value="Cash on Delivery">Cash on Delivery (COD)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Delivery Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <button
            type="submit"
            style={{
              marginTop: '0.375rem',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
          >
            Submit Phone Order
          </button>
        </form>
      </Drawer>

      {/* Official Delivery & Packing Slip Modal */}
      <PackingSlipModal
        isOpen={!!packingSlipOrder}
        onClose={() => setPackingSlipOrder(null)}
        order={packingSlipOrder}
        storeName={packingSlipOrder?.storeId ? stores.find((s) => s.id === packingSlipOrder.storeId)?.name : undefined}
      />
    </div>
  );
}

