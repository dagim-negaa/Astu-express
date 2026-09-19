import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/inventory')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/warehouse' });
  },
  component: () => null,
});
