import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '../components/layout/AdminLayout';

export const Route = createFileRoute('/admin')({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
