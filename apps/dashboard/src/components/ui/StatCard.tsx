import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = '#0ea5e9',
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        padding: '1rem 1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.625rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Hanken Grotesk', system-ui, sans-serif", marginTop: '0.2rem', lineHeight: 1.1 }}>
            {value}
          </div>
        </div>
        <div
          style={{
            width: '2.375rem',
            height: '2.375rem',
            borderRadius: '0.375rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
          {trend && (
            <span
              style={{
                fontWeight: 700,
                color: trend.isPositive ? '#16a34a' : '#dc2626',
                backgroundColor: trend.isPositive ? '#f0fdf4' : '#fef2f2',
                padding: '0.12rem 0.4rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span style={{ color: '#8a7a6a', fontSize: '0.8125rem' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
