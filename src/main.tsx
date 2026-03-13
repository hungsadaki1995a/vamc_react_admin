// StrictMode is intentionally disabled
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { queryClient } from '@/lib/api/queryClient';
import App from '@/app/App';
import '@/styles/global.css';

ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  // </StrictMode>
);
