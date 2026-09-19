import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { routeTree } from './routeTree.gen';
import { setAssetsBaseUrl } from '@astu/shared';
import { API_URL } from './lib/auth-client';
import './index.css';

// Initialize shared assets resolver with authoritative backend API URL
setAssetsBaseUrl(API_URL);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
