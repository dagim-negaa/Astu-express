import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { AdminStoreProvider } from '../store/AdminStore';
import { AlertCircle } from 'lucide-react';

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return (
    <AdminStoreProvider>
      <Outlet />
    </AdminStoreProvider>
  );
}

function RootErrorComponent({ error }: { error: any }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', backgroundColor: '#ffffff', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Something went wrong</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.5rem' }}>{error?.message || 'An unexpected routing error occurred.'}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/" style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Storefront
          </Link>
          <Link to="/admin" style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

