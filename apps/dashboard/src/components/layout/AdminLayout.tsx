import React, { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useAdminStore } from '../../store/AdminStore';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

const AdminContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const isPublicRoute = location.pathname === '/privacy';

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      window.location.href = '/auth?admin=true';
    }
  }, [isAuthenticated, isPublicRoute]);

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              border: '3px solid #0ea5e9',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Public unauthenticated view for /privacy
  if (!isAuthenticated && isPublicRoute) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#fcfbf9',
          color: '#211a13',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e8e2d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.4rem',
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                fontFamily: 'Hanken Grotesk, sans-serif',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(14, 165, 233, 0.25)',
              }}
            >
              A
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                  lineHeight: 1.1,
                  display: 'block',
                }}
              >
                ASTU EXPRESS
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  color: '#0284c7',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                }}
              >
                Dashboard &bull; Privacy &amp; Legal
              </span>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '2rem 1.5rem 4rem', width: '100%', maxWidth: '840px', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    );
  }

  // Authenticated view with full admin sidebar and header
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: "'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        margin: 0,
        marginLeft: 0,
        marginRight: 0,
        padding: 0,
      }}
    >
      {/* Collapsible Sidebar Rail - Locked to Viewport Height */}
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Full-Width Content Area - Independent Scroll Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
          minWidth: 0,
          width: '100%',
          margin: 0,
          marginLeft: 0,
          marginRight: 0,
          padding: 0,
        }}
      >
        {!isPublicRoute && <AdminHeader />}
        <main style={{ flex: 1, padding: isPublicRoute ? '1.5rem 1rem 3rem' : '1.25rem 1rem', width: '100%', boxSizing: 'border-box', margin: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AdminContentArea>{children}</AdminContentArea>;
};
