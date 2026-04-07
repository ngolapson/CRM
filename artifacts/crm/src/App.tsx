import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { CustomersTab } from "@/pages/CustomersTab";
import { ReportsTab } from "@/pages/ReportsTab";
import { OperationsTab } from "@/pages/OperationsTab";
import { SettingsTab } from "@/pages/SettingsTab";
import { LoginPage } from "@/pages/LoginPage";
import { AuthProvider, useAuth } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/" component={CustomersTab} />
      <Route path="/bao-cao" component={ReportsTab} />
      <Route path="/van-hanh" component={OperationsTab} />
      <Route path="/cai-dat" component={SettingsTab} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
