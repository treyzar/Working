import { BrowserRouter } from "react-router-dom";
import { Layout } from "../layouts/Layout/Layout";
import { AppContent } from "../components/AppContent";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installAuthInterceptor } from "../../shared/utils/services/response";
const App = () => {
  const queryClient = new QueryClient();
  installAuthInterceptor(queryClient);
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
