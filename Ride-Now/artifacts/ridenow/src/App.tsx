import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

import LoginPage from "@/pages/LoginPage";
import BookRidePage from "@/pages/customer/BookRidePage";
import RideHistoryPage from "@/pages/customer/RideHistoryPage";
import RentalsPage from "@/pages/customer/RentalsPage";
import ProfilePage from "@/pages/customer/ProfilePage";
import DriverDashboardPage from "@/pages/driver/DriverDashboardPage";
import AvailableRidesPage from "@/pages/driver/AvailableRidesPage";
import EarningsPage from "@/pages/driver/EarningsPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ManageUsersPage from "@/pages/admin/ManageUsersPage";
import ManageDriversPage from "@/pages/admin/ManageDriversPage";
import ManageRidesPage from "@/pages/admin/ManageRidesPage";
import ManageVehiclesPage from "@/pages/admin/ManageVehiclesPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === "admin") { navigate("/admin"); return null; }
    if (user.role === "driver") { navigate("/driver"); return null; }
    navigate("/");
    return null;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated && user) {
    if (user.role === "admin") { navigate("/admin"); return null; }
    if (user.role === "driver") { navigate("/driver"); return null; }
    navigate("/");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <AuthRoute><LoginPage /></AuthRoute>
      </Route>

      {/* Customer routes */}
      <Route path="/">
        <ProtectedRoute roles={["customer"]}>
          <Layout><BookRidePage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/rentals">
        <ProtectedRoute roles={["customer"]}>
          <Layout><RentalsPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute roles={["customer"]}>
          <Layout><RideHistoryPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute roles={["customer"]}>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      </Route>

      {/* Driver routes */}
      <Route path="/driver">
        <ProtectedRoute roles={["driver"]}>
          <Layout><DriverDashboardPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/rides">
        <ProtectedRoute roles={["driver"]}>
          <Layout><AvailableRidesPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/earnings">
        <ProtectedRoute roles={["driver"]}>
          <Layout><EarningsPage /></Layout>
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute roles={["admin"]}>
          <Layout><AdminDashboardPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute roles={["admin"]}>
          <Layout><ManageUsersPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/drivers">
        <ProtectedRoute roles={["admin"]}>
          <Layout><ManageDriversPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/rides">
        <ProtectedRoute roles={["admin"]}>
          <Layout><ManageRidesPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/vehicles">
        <ProtectedRoute roles={["admin"]}>
          <Layout><ManageVehiclesPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute roles={["admin"]}>
          <Layout><AnalyticsPage /></Layout>
        </ProtectedRoute>
      </Route>

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
