import React from 'react';

interface StatusPillProps {
  status: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getStyle = (s: string) => {
    const normalized = s.toLowerCase().replace(/[\s-]/g, '_');
    switch (normalized) {
      case 'in_production':
      case 'processing':
      case 'pending':
      case 'placed':
        return { bg: '#fdf2f0', color: '#8b3224', border: '#f5cfc7', label: s.replace('_', ' ') };
      case 'shipped':
      case 'quality_check':
      case 'dispatched':
        return { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd', label: s.replace('_', ' ') };
      case 'delivered':
      case 'completed':
      case 'active':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: s.replace('_', ' ') };
      case 'cancelled':
      case 'inactive':
      case 'draft':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: s.replace('_', ' ') };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: s.replace('_', ' ') };
    }
  };

  const style = getStyle(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.8125rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
};
