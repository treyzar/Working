import { BrowserRouter } from "react-router-dom";
import { Layout } from "./layouts/layout/Layout";
import { AppContent } from "./components/AppContent";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  bootstrapProfile,
  installAuthInterceptor,
} from "../shared/api/response";
import { useEffect, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <AppContent />
          </Layout>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </TooltipProvider>
  );
};

export default App;
