import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAdminStore } from '../../store/AdminStore';
import { LoginSchema, validateData } from '@astu/shared';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

const AdminLoginScreen: React.FC = () => {
  const { login } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateData(LoginSchema, {
      email: email.trim(),
      password,
    });
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#fff8f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e8e2d8',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          padding: '2.25rem 2rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: '0.625rem',
              backgroundColor: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.875rem',
              border: '1px solid #bae6fd',
            }}
          >
            <ShieldCheck size={26} color="#0284c7" />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              fontFamily: 'Hanken Grotesk, sans-serif',
            }}
          >
            R2 EXPRESS
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Ethiopian Shipping & Mini ERP Authentication
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.35rem' }}>
              Staff / Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a7a6a' }}>
                <Mail size={17} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@r2express.com"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a7a6a' }}>
                <Lock size={17} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 4 Role Quick-Fills */}
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Quick Login by Role:</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@admin.com');
                    setPassword('admin1234');
                    setError(null);
                  }}
                  style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.7rem',
                    color: '#0369a1',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@r2express.com');
                    setPassword('admin1234');
                    setError(null);
                  }}
                  style={{
                    backgroundColor: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.7rem',
                    color: '#7e22ce',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Owner (Master)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@r2express.com');
                    setPassword('manager1234');
                    setError(null);
                  }}
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.7rem',
                    color: '#b45309',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('operator@r2express.com');
                    setPassword('operator1234');
                    setError(null);
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.7rem',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Operator
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.15s ease',
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!isLoading && <ArrowRight size={17} />}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1ece4', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/"
            style={{
              fontSize: '0.8125rem',
              color: '#0284c7',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            &larr; Return to Customer Storefront
          </Link>
          <Link
            to="/privacy"
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

const AdminContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const isPublicRoute = location.pathname === '/privacy';

  if (!isAuthenticated && !isPublicRoute) {
    return <AdminLoginScreen />;
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: "'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: 'hidden' }}>
      {/* Collapsible Sidebar Rail - Locked to Viewport Height */}
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Full-Width Content Area - Independent Scroll Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', minWidth: 0, width: '100%' }}>
        {!isPublicRoute && <AdminHeader />}
        <main style={{ flex: 1, padding: isPublicRoute ? '2rem 1.75rem 4rem' : '1.25rem 1.75rem', width: '100%', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AdminContentArea>{children}</AdminContentArea>;
};
