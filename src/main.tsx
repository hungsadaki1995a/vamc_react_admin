// StrictMode is intentionally disabled
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import App from '@/app/App';
import '@/styles/global.css';

async function bootstrap() {
  if (import.meta.env.VITE_MOCK === 'true') {
    const { setupMocks } = await import('@/mocks/setup');
    setupMocks();
  }

  createRoot(document.getElementById('root')!).render(
    // <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    // </StrictMode>
  );
}

bootstrap();
