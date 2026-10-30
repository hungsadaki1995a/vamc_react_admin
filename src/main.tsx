// StrictMode is intentionally disabled
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import { client as heyApiClient } from '@/api/generated/client.gen';
import { apiClient } from '@/lib/api/client';
import App from '@/app/App';
import '@/styles/global.css';

// Bind Hey API generated client to use the project's customized Axios instance
heyApiClient.setConfig({
  axios: apiClient,
});

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  // </StrictMode>
);
