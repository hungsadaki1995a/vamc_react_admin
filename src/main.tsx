// StrictMode is intentionally disabled
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import App from '@/app/App';
import '@/styles/global.css';

async function prepare(): Promise<void> {
  if (import.meta.env.VITE_MOCK === 'true') {
    // All three imports are dynamic — excluded from production bundle when VITE_MOCK !== 'true'
    const { initMockSession } = await import('./mocks/initMockSession');
    const { clearMockCache } = await import('./mocks/clearMockCache');
    const { worker } = await import('./mocks/browser');

    initMockSession();
    await clearMockCache();
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    // <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    // </StrictMode>
  );
});
