import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminApplications from "./pages/AdminApplications";
import AdminStudents from "./pages/AdminStudents";
import AdminSchools from "./pages/AdminSchools";
import AdminReceipts from "./pages/AdminReceipts";
import AdminIDCards from "./pages/AdminIDCards";
import AdminPayments from "./pages/AdminPayments";
import AdminPaymentHistory from "./pages/AdminPaymentHistory";
import AdminPaymentsDashboard from "./pages/AdminPaymentsDashboard";
import AdminSettings from "./pages/AdminSettings";
import SchoolDashboard from "./pages/SchoolDashboard";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/admin" replace /> : <Auth />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/schools" element={<ProtectedRoute><AdminSchools /></ProtectedRoute>} />
      <Route path="/admin/receipts" element={<ProtectedRoute><AdminReceipts /></ProtectedRoute>} />
      <Route path="/admin/id-cards" element={<ProtectedRoute><AdminIDCards /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/payment-history" element={<ProtectedRoute><AdminPaymentHistory /></ProtectedRoute>} />
      <Route path="/admin/payments-dashboard" element={<ProtectedRoute><AdminPaymentsDashboard /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/school" element={<ProtectedRoute><SchoolDashboard /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/" element={<Navigate to={user ? "/admin" : "/auth"} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
