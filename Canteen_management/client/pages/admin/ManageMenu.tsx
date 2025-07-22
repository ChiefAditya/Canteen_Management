// client/pages/admin/ManageMenu.tsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import MenuItemsList from "@/components/MenuItemsList";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { User, Shield, LogOut, LayoutDashboard, Menu, ClipboardList, History, QrCode } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Define the structure of the canteen data we expect from the API
interface CanteenWithStats {
  _id: string;
  name: string;
  totalMenuItems: number;
  availableMenuItems: number;
}

const ManageMenu: React.FC = () => {
  const [canteens, setCanteens] = useState<CanteenWithStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const username = user?.username || "Admin";
  const assignedCanteens = user?.assignedCanteens || [];
  const isSuperAdmin =
    !assignedCanteens ||
    assignedCanteens.length === 0 ||
    username === "super_admin";
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, onClick: () => navigate("/admin/dashboard") },
    { id: "manage-menu", label: "Manage Menu", icon: Menu, onClick: () => navigate("/admin/manage-menu") },
    { id: "orders", label: "Manage Orders", icon: ClipboardList, onClick: () => navigate("/admin/dashboard") },
    { id: "history", label: "Order History", icon: History, onClick: () => navigate("/admin/dashboard") },
    ...(isSuperAdmin
      ? [{ id: "users", label: "User Management", icon: User, onClick: () => navigate("/admin/dashboard") }]
      : []),
    { id: "qr", label: "Mange QR Code", icon: QrCode, onClick: () => navigate("/admin/dashboard") },
  ];

  useEffect(() => {
    const fetchCanteenStats = async () => {
      try {
        // Call the backend API endpoint we fixed
        const response = await fetch('/api/canteens');
        if (!response.ok) {
          throw new Error('Failed to fetch data from the server.');
        }
        const result = await response.json();

        if (result.success) {
          // After fetching canteens from API, filter them for non-super-admins
          let filteredCanteens = result.data.canteens;
          if (user && user.role === "admin" && Array.isArray(user.assignedCanteens) && user.assignedCanteens.length > 0) {
            filteredCanteens = filteredCanteens.filter((c: any) => user.assignedCanteens.includes(c._id));
          }
          setCanteens(filteredCanteens);
        } else {
          throw new Error(result.message || 'An unknown error occurred.');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching canteen stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanteenStats();
  }, []); // The empty array [] means this runs once when the component loads

  // Add a function to refresh canteen stats
  const refreshCanteenStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/canteens');
      if (!response.ok) throw new Error('Failed to fetch data from the server.');
      const result = await response.json();
      let filteredCanteens = result.data.canteens;
      if (user && user.role === "admin" && Array.isArray(user.assignedCanteens) && user.assignedCanteens.length > 0) {
        filteredCanteens = filteredCanteens.filter((c: any) => user.assignedCanteens.includes(c._id));
      }
      setCanteens(filteredCanteens);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching canteen stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=200"
                alt="CSIR CRRI Logo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Canteen Management
                </h1>
                <p className="text-sm text-gray-600">
                  {assignedCanteens.length === 1
                    ? "Administration Panel"
                    : "Multi-Canteen Access"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      location.pathname === "/admin/" + item.id.replace("-", "-")
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {assignedCanteens.length === 1
                    ? "Management"
                    : "Multi-Canteen"}
                </p>
                <p className="text-xs text-gray-500">
                  {assignedCanteens.length === 1
                    ? "Admin Access"
                    : "Multi-Canteen"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await logout(); navigate("/"); }}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Menu Management
                </h2>
                {assignedCanteens.length > 0 && assignedCanteens.length < 2 && (
                  <Badge variant="outline" className="text-xs">
                    {/* Show canteen names if only one assigned */}
                    {assignedCanteens.length === 1 ? "Single Canteen" : "Multiple Canteens"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {assignedCanteens.length === 1 ? "Single Canteen" : "System Admin"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            {canteens.length === 0 ? (
              <div className="text-center text-gray-500">No canteens available.</div>
            ) : (
              canteens.map((canteen) => (
                <div key={canteen._id} className="space-y-4 border rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{canteen.name}</h3>
                    <span className="text-sm text-gray-500">
                      Total Items: {canteen.totalMenuItems} | Available: {canteen.availableMenuItems}
                    </span>
                  </div>
                  <MenuItemsList
                    canteenId={canteen._id}
                    canteenName={canteen.name}
                    onRefresh={refreshCanteenStats}
                  />
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManageMenu;