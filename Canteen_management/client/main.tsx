import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Components and Pages
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageMenu from "./pages/admin/ManageMenu"; // 1. IMPORT THE NEW PAGE
import CanteenSelection from "./pages/user/CanteenSelection";
import Menu from "./pages/user/Menu";
import OrderHistory from "./pages/user/OrderHistory";
import Payment from "./pages/user/Payment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* 2. ADD THE NEW ROUTE FOR MANAGE MENU */}
            <Route
              path="/admin/manage-menu"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageMenu />
                </ProtectedRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/user/canteens"
              element={
                <ProtectedRoute requiredRole="user">
                  <CanteenSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/menu/:canteenId"
              element={
                <ProtectedRoute requiredRole="user">
                  <Menu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders"
              element={
                <ProtectedRoute requiredRole="user">
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/payment"
              element={
                <ProtectedRoute requiredRole="user">
                  <Payment />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);