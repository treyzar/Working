import { BrowserRouter } from 'react-router-dom';
import { Layout } from './layouts/layout/Layout';
import { AppContent } from './components/AppContent';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { bootstrapProfile, installAuthInterceptor } from '../shared/api/response';
import '../../style.css';
import { useEffect, useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast';

const App = () => {
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    installAuthInterceptor(queryClient);
  }, [queryClient]);

  useEffect(() => {
    bootstrapProfile(queryClient).catch(() => {});
  }, [queryClient]);

  return (
    <TooltipProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Layout>
              <AppContent />
            </Layout>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ToastProvider>
    </TooltipProvider>
  );
};

export default App;
