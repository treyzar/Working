import { BrowserRouter } from "react-router-dom";
import { Layout } from "../layouts/Layout/Layout";
import { AppContent } from "../components/AppContent";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  bootstrapProfile,
  installAuthInterceptor,
} from "../../shared/utils/services/response";
import { useEffect, useMemo } from "react";

const App = () => {
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    installAuthInterceptor(queryClient);
  }, [queryClient]);

  useEffect(() => {
    bootstrapProfile(queryClient).catch(() => {});
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <AppContent />
        </Layout>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
