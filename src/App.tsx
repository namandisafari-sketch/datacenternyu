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
import AdminStudentSearch from "./pages/AdminStudentSearch";
import AdminSettings from "./pages/AdminSettings";
import SchoolDashboard from "./pages/SchoolDashboard";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import BursaryRequest from "./pages/BursaryRequest";
import AdminBursaryRequests from "./pages/AdminBursaryRequests";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPassportPhoto from "./pages/AdminPassportPhoto";
import AdminSecurity from "./pages/AdminSecurity";
import AdminAttendance from "./pages/AdminAttendance";
import AdminStaff from "./pages/AdminStaff";
import AdminMaterials from "./pages/AdminMaterials";
import AdminAccounting from "./pages/AdminAccounting";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminBackup from "./pages/AdminBackup";
import AdminPhotocopying from "./pages/AdminPhotocopying";
import AdminBatchProcessing from "./pages/AdminBatchProcessing";

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
      <Route path="/auth" element={user && !sessionStorage.getItem("device_check_pending") ? <Navigate to="/admin" replace /> : <Auth />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/schools" element={<ProtectedRoute><AdminSchools /></ProtectedRoute>} />
      <Route path="/admin/receipts" element={<ProtectedRoute><AdminReceipts /></ProtectedRoute>} />
      <Route path="/admin/id-cards" element={<ProtectedRoute><AdminIDCards /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/payment-history" element={<ProtectedRoute><AdminPaymentHistory /></ProtectedRoute>} />
      <Route path="/admin/payments-dashboard" element={<ProtectedRoute><AdminPaymentsDashboard /></ProtectedRoute>} />
      <Route path="/admin/student-search" element={<ProtectedRoute><AdminStudentSearch /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/bursary-requests" element={<ProtectedRoute><AdminBursaryRequests /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/passport-photo" element={<ProtectedRoute><AdminPassportPhoto /></ProtectedRoute>} />
      <Route path="/admin/security" element={<ProtectedRoute><AdminSecurity /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />
      <Route path="/admin/materials" element={<ProtectedRoute><AdminMaterials /></ProtectedRoute>} />
      <Route path="/admin/accounting" element={<ProtectedRoute><AdminAccounting /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute><AdminAuditLogs /></ProtectedRoute>} />
      <Route path="/admin/backup" element={<ProtectedRoute><AdminBackup /></ProtectedRoute>} />
      <Route path="/admin/photocopying" element={<ProtectedRoute><AdminPhotocopying /></ProtectedRoute>} />
      <Route path="/admin/batch-processing" element={<ProtectedRoute><AdminBatchProcessing /></ProtectedRoute>} />
      
      <Route path="/bursary-request" element={<BursaryRequest />} />
      <Route path="/school" element={<ProtectedRoute><SchoolDashboard /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/" element={user ? <Navigate to="/admin" replace /> : <Navigate to="/auth" replace />} />
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
