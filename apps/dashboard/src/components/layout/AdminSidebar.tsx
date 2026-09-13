import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Users,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShoppingCart,
  Receipt,
  PackageCheck,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useAdminStore } from '../../store/AdminStore';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { currentUser } = useAdminStore();

  const userRole = (currentUser?.role || 'Admin').toLowerCase();
  const isMaster = userRole === 'admin' || userRole === 'owner';
  const isManager = userRole === 'manager';
  const isOperator = userRole === 'operator';

  const allNavItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Inventory', path: '/admin/inventory', icon: Layers },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Suppliers', path: '/admin/suppliers', icon: Truck },
    { label: 'Purchases', path: '/admin/purchases', icon: ShoppingCart },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { label: 'Shipments', path: '/admin/shipments', icon: PackageCheck },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Staff & Team', path: '/admin/staff', icon: UserCheck },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Role-Based Access Control filtering
  const navItems = allNavItems.filter((item) => {
    if (isMaster) return true; // Admin & Owner can do everything
    if (isManager) {
      // Manager manages supplier purchase orders, expenses, and shipments
      return ['Overview', 'Suppliers', 'Purchases', 'Expenses', 'Shipments', 'Inventory', 'Reports'].includes(item.label);
    }
    if (isOperator) {
      // Operator manages product orders, customer image uploads, products
      return ['Overview', 'Products', 'Orders', 'Customers'].includes(item.label);
    }
    return false;
  });

  return (
    <aside
      style={{
        width: isCollapsed ? '80px' : '280px',
        backgroundColor: '#0a1120',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid #1e293b',
        zIndex: 30,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            padding: isCollapsed ? '0 0.5rem' : '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '0.625rem',
            borderBottom: '1px solid #1e293b',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.95rem',
              fontFamily: 'Hanken Grotesk, sans-serif',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            }}
          >
            R2
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.1 }}>
                R2 EXPRESS
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '0.625rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  Mini ERP & Shipping
                </span>
                <span style={{ fontSize: '0.5625rem', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', backgroundColor: '#1e293b', color: '#94a3b8', fontWeight: 700 }}>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Generously Spaced Nav Links */}
        <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: isCollapsed ? '0.75rem 0' : '0.65rem 0.9rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '0.4rem',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <Icon size={19} color={isActive ? '#38bdf8' : '#94a3b8'} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: '3px', backgroundColor: '#38bdf8', borderRadius: '2px 0 0 2px' }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Customer Storefront Link & Collapse Toggle */}
      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link
          to="/"
          title="Preview Customer Storefront"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '0.6rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '0.375rem',
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'background-color 0.15s ease',
          }}
        >
          <ExternalLink size={16} />
          {!isCollapsed && <span>View Storefront</span>}
        </Link>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#0f1d30',
            border: '1px solid #1e293b',
            borderRadius: '0.375rem',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'background-color 0.15s ease',
          }}
        >
          {!isCollapsed && <span>Collapse</span>}
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
