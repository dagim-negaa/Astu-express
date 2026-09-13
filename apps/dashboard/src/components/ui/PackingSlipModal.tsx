import React from 'react';
import { Modal } from './Modal';
import type { AdminOrder } from '../../store/AdminStore';
import { Printer, AlertTriangle, CheckCircle2, MapPin, Phone, Mail } from 'lucide-react';

interface PackingSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  storeName?: string;
}

interface OrderItemEntry {
  sku: string;
  title: string;
  priceEtb: number;
  quantity: number;
  size?: string | null;
  colorName?: string | null;
}

function getOrderItems(order: AdminOrder): OrderItemEntry[] {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it: any) => ({
      sku: it.sku || 'MTF-ATELIER',
      title: it.title || it.name || 'Bespoke Garment',
      priceEtb: Number(it.priceEtb ?? it.price ?? it.unitPrice ?? 0),
      quantity: Number(it.quantity) || 1,
      size: it.size || null,
      colorName: it.colorName || it.color || null,
    }));
  }
  return [
    {
      sku: order.garmentSku || 'MTF-ATELIER',
      title: order.garmentTitle || 'Bespoke Garment',
      priceEtb: order.quantity > 0 ? Math.round(order.totalPriceEtb / order.quantity) : order.totalPriceEtb,
      quantity: order.quantity || 1,
      size: null,
      colorName: null,
    },
  ];
}

function formatPrintDate(dateStr?: string) {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({ isOpen, onClose, order, storeName }) => {
  if (!order) return null;

  const items = getOrderItems(order);
  const isCod = order.paymentMethod === 'Cash on Delivery';
  const isPaid = order.paymentStatus === 'paid';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delivery & Packing Slip — #${order.id}`} maxWidth="720px">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #astu-printable-packing-slip, #astu-printable-packing-slip * {
            visibility: visible !important;
          }
          #astu-printable-packing-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Printable Area */}
        <div
          id="astu-printable-packing-slip"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            fontFamily: "'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#0f172a',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '0.875rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Hanken Grotesk, sans-serif', letterSpacing: '0.04em', color: '#0f172a' }}>
                ASTU EXPRESS
              </h1>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78125rem', color: '#475569', fontWeight: 500 }}>
                Campus Express & Logistics · ASTU Adama Hub, Ethiopia
              </p>
              {storeName && (
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                  Dispatch Hub: {storeName}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#211a13', color: '#f5f5f0', fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Official Packing Slip
              </span>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.9375rem', fontWeight: 800, fontFamily: 'monospace', color: '#211a13' }}>
                #{order.id}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#665c52' }}>
                {formatPrintDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Customer & Order Routing Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', backgroundColor: '#fcfbf9', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e8e2d8' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deliver To:
              </span>
              <h3 style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: '#211a13' }}>
                {order.customerName}
              </h3>
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.78125rem', color: '#524535' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={12} color="#0ea5e9" /> {order.customerPhone || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={12} color="#0ea5e9" /> {order.customerEmail}
                </span>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.2rem', fontWeight: 600, color: '#211a13' }}>
                  <MapPin size={13} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '0.15rem' }} /> {order.shippingAddress}
                </span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #e8e2d8', paddingLeft: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#8a7a6a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Order Profile:
              </span>
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78125rem' }}>
                <div>
                  <span style={{ color: '#8a7a6a' }}>Channel: </span>
                  <span style={{ fontWeight: 700, color: '#211a13' }}>
                    {order.orderSource === 'app' ? '📱 Mobile App Order' : '📞 Phone / Atelier Order'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8a7a6a' }}>Fulfillment: </span>
                  <span style={{ fontWeight: 700, color: '#211a13', textTransform: 'uppercase' }}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8a7a6a' }}>Payment Method: </span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>
                    {order.paymentMethod}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8a7a6a' }}>Payment Status: </span>
                  <span style={{ fontWeight: 800, color: isPaid ? '#15803d' : '#b45309' }}>
                    {isPaid ? 'PAID ✓' : (isCod ? 'PENDING (PAY UPON HANDOVER)' : 'PENDING')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Handover Instruction Alert Box */}
          {isCod && !isPaid ? (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '2px solid #f59e0b',
                borderRadius: '0.375rem',
                padding: '0.875rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <AlertTriangle size={24} color="#b45309" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  ⚠️ Cash on Delivery (COD) — Courier Payment Collection Required
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.4 }}>
                  The dispatch courier must collect <strong>ETB {order.totalPriceEtb.toLocaleString()}</strong> in cash or verified mobile transfer (Telebirr/CBE) upon physical doorstep handover before releasing this garment package to the client.
                </p>
                <div style={{ marginTop: '0.4rem', fontSize: '0.875rem', fontWeight: 800, color: '#92400e' }}>
                  Exact Amount to Collect: ETB {order.totalPriceEtb.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '0.375rem',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <CheckCircle2 size={20} color="#15803d" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  ✓ Prepaid Digital Order — Do Not Collect Cash
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', marginTop: '0.1rem' }}>
                  Payment settled in full via {order.paymentProvider || order.paymentMethod}. Verify recipient identity and release package.
                </span>
              </div>
            </div>
          )}

          {/* Itemized Garment Manifest Table */}
          <div style={{ overflow: 'hidden', border: '1px solid #e8e2d8', borderRadius: '0.375rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#211a13', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '0.625rem 0.75rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>#</th>
                  <th style={{ padding: '0.625rem 0.75rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Garment Description</th>
                  <th style={{ padding: '0.625rem 0.75rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>SKU</th>
                  <th style={{ padding: '0.625rem 0.75rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Size</th>
                  <th style={{ padding: '0.625rem 0.75rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Color</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Qty</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Unit Price</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Total (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e8e2d8', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfbf9' }}>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#8a7a6a', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#211a13' }}>{it.title}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'monospace', color: '#665c52' }}>{it.sku}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#211a13', fontWeight: 600 }}>{it.size || '—'}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#211a13', fontWeight: 600 }}>{it.colorName || '—'}</td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#524535' }}>ETB {it.priceEtb.toLocaleString()}</td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#211a13' }}>
                      ETB {(it.priceEtb * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#665c52' }}>
                <span>Garment Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#211a13' }}>ETB {order.totalPriceEtb.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#665c52' }}>
                <span>Delivery & Handling:</span>
                <span style={{ fontWeight: 600, color: '#15803d' }}>Complimentary (Free)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #211a13', paddingTop: '0.4rem', fontSize: '0.9375rem', fontWeight: 800, color: '#8b3224' }}>
                <span>Grand Total:</span>
                <span>ETB {order.totalPriceEtb.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Dual Handover & Acceptance Block */}
          <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
            {/* Atelier Dispatch Handover */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 800, color: '#211a13', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Atelier Dispatch Handover
              </span>
              <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>Dispatched By (Staff Name): ________________________</div>
                <div>Courier Service / Rider: __________________________</div>
                <div>Date & Signature: _________________________________</div>
              </div>
            </div>

            {/* Recipient Handover Acceptance */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 800, color: '#211a13', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Recipient Delivery Acceptance
              </span>
              <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>Received in Good Condition By: _____________________</div>
                <div>Date & Client Signature: __________________________</div>
                {isCod && (
                  <div style={{ fontWeight: 700, color: '#92400e' }}>
                    [ &nbsp; ] Cash of ETB {order.totalPriceEtb.toLocaleString()} collected in full
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            ASTU Express · Inquiries: support@astuexpress.com
          </div>
        </div>

        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.875rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Ready for physical courier dispatch docket
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
              }}
            >
              <Printer size={15} /> Print Official Slip
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
