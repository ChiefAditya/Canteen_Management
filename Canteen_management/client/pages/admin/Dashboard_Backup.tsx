import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QRUploadModal from "@/components/QRUploadModal";
import MenuItemModal from "@/components/MenuItemModal";
import MenuItemsList from "@/components/MenuItemsList";
import {
  LayoutDashboard,
  Menu,
  ClipboardList,
  History,
  QrCode,
  LogOut,
  Plus,
  User,
  Upload,
  Eye,
  Shield,
  Loader2,
  TrendingUp,
  DollarSign,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderAPI, menuAPI, handleAPIError } from "@/lib/api";
import type { Order, MenuItem } from "@shared/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const username = user?.username || "Admin";
  const assignedCanteens = user?.assignedCanteens || [];
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrUploadModal, setQrUploadModal] = useState<{
    isOpen: boolean;
    canteenId: string;
    canteenName: string;
  }>({
    isOpen: false,
    canteenId: "",
    canteenName: "",
  });

  const [menuModal, setMenuModal] = useState<{
    isOpen: boolean;
    canteenId: string;
    canteenName: string;
  }>({
    isOpen: false,
    canteenId: "",
    canteenName: "",
  });

  const [selectedCanteenForMenu, setSelectedCanteenForMenu] = useState<
    string | null
  >(null);

  // Real-time analytics state
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    organizationOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [dailyStats, setDailyStats] = useState<
    { day: string; orders: number; revenue: number }[]
  >([]);

  // Menu management state
  const [menuItems, setMenuItems] = useState<{
    [canteenId: string]: MenuItem[];
  }>({});
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);

  // Mock QR codes storage - in real app, this would come from API
  const [qrCodes, setQrCodes] = useState<{
    [key: string]: string;
  }>({
    "canteen-a": "",
    "canteen-b": "",
  });

  // Available canteens based on admin's assignment
  const availableCanteens = [
    { id: "canteen-a", name: "Campus Canteen A" },
    { id: "canteen-b", name: "Guest House Canteen" },
  ].filter(
    (canteen) =>
      assignedCanteens.length === 0 || assignedCanteens.includes(canteen.id),
  );

  // Fetch menu items for all canteens
  const fetchMenuItems = async () => {
    try {
      setLoadingMenuItems(true);
      const menuData: { [canteenId: string]: MenuItem[] } = {};

      for (const canteen of availableCanteens) {
        const items = await menuAPI.getAll({ canteenId: canteen.id });
        menuData[canteen.id] = items;
      }

      setMenuItems(menuData);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // Fetch real-time analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);

        const today = new Date().toISOString().split("T")[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Get analytics data
        const analyticsData = await orderAPI.getAnalytics({
          startDate: weekAgo,
          endDate: today,
          canteenId:
            assignedCanteens.length === 1 ? assignedCanteens[0] : undefined,
        });

        // Get recent orders
        const ordersData = await orderAPI.getAll({
          limit: 50,
          canteenId:
            assignedCanteens.length === 1 ? assignedCanteens[0] : undefined,
        });

        setAnalytics(analyticsData);
        setOrders(ordersData.orders);

        // Calculate daily stats for last 5 days
        const last5Days = Array.from({ length: 5 }, (_, i) => {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split("T")[0];
          const dayOrders = ordersData.orders.filter(
            (order) =>
              order.orderDate === dateStr ||
              (order.createdAt && order.createdAt.startsWith(dateStr)),
          );

          return {
            day: (i + 1).toString(),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
          };
        }).reverse();

        setDailyStats(last5Days);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    if (activeTab === "dashboard") {
      fetchAnalytics();
      // Refresh every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, assignedCanteens]);

  // Fetch menu items when menu tab is active
  useEffect(() => {
    if (activeTab === "menu") {
      fetchMenuItems();
    }
  }, [activeTab, availableCanteens]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const handleQRUpload = async (file: File, canteenId: string) => {
    // In real app, this would upload to server/cloud storage
    // For demo, we'll create a local object URL
    const url = URL.createObjectURL(file);
    setQrCodes((prev) => ({
      ...prev,
      [canteenId]: url,
    }));

    // Also store in localStorage for persistence across sessions
    localStorage.setItem(`qr-${canteenId}`, url);
  };

  const openQRUpload = (canteenId: string, canteenName: string) => {
    setQrUploadModal({
      isOpen: true,
      canteenId,
      canteenName,
    });
  };

  const closeQRUpload = () => {
    setQrUploadModal({
      isOpen: false,
      canteenId: "",
      canteenName: "",
    });
  };

  const openMenuModal = (canteenId: string, canteenName: string) => {
    setMenuModal({
      isOpen: true,
      canteenId,
      canteenName,
    });
  };

  const closeMenuModal = () => {
    setMenuModal({
      isOpen: false,
      canteenId: "",
      canteenName: "",
    });
  };

  const handleViewMenuItems = (canteenId: string) => {
    setSelectedCanteenForMenu(canteenId);
  };

  const handleMenuModalSuccess = () => {
    // Refresh menu items after successful add/edit
    fetchMenuItems();
  };

  const openAddItemModal = (canteenId: string, canteenName: string) => {
    setMenuModal({
      isOpen: true,
      canteenId,
      canteenName,
    });
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "menu", label: "Manage Menu", icon: Menu },
    { id: "orders", label: "Manage Orders", icon: ClipboardList },
    { id: "history", label: "Order History", icon: History },
    { id: "qr", label: "Mange QR Code", icon: QrCode },
  ];

  // Calculate today's data
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(
    (order) =>
      order.orderDate === today ||
      (order.createdAt && order.createdAt.startsWith(today)),
  );
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

  // Get pending organization bills
  const pendingOrgOrders = orders.filter(
    (order) =>
      order.paymentType === "organization" && order.status === "pending",
  );

  const maxValue = Math.max(...dailyStats.map((d) => d.orders), 1);

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
                className="h-8 w-auto"
              />
              <span className="font-semibold text-gray-900">Dashboard</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.fullName || username} •{" "}
                  {user?.department || "Administration"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">crridom.gov.in</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            {/* Canteen Access Info */}
            {availableCanteens.length > 0 && availableCanteens.length < 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Canteen Access:{" "}
                    {availableCanteens.map((c) => c.name).join(", ")}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  You have administrative access to the canteens listed above.
                </p>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Real-Time Analytics
                    {assignedCanteens.length > 0 &&
                      assignedCanteens.length < 2 && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({availableCanteens.map((c) => c.name).join(", ")})
                        </span>
                      )}
                  </h2>
                  {loadingAnalytics && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading live data...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Orders Trend Chart */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-medium text-gray-900">
                          Orders Last 5 Days
                        </h3>
                      </div>

                      {/* Real-time Bar Chart */}
                      <div className="flex items-end gap-2 h-20">
                        {dailyStats.map((data, index) => (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full bg-blue-600 rounded-sm transition-all duration-300"
                              style={{
                                height: `${Math.max((data.orders / maxValue) * 60, 4)}px`,
                                minHeight: "4px",
                              }}
                              title={`Day ${data.day}: ${data.orders} orders, ₹${data.revenue}`}
                            />
                            <span className="text-xs text-gray-500">
                              {data.day}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {dailyStats.reduce((sum, d) => sum + d.orders, 0)} total
                        orders
                      </div>
                    </div>
                  </Card>

                  {/* Today's Revenue */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <h3 className="text-sm font-medium text-gray-900">
                          Today's Revenue
                        </h3>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{todayRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {todayOrders.length} orders today
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Total Revenue (All Time)
                        </h4>
                        <p className="text-lg font-semibold text-green-600">
                          ₹{analytics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Pending Organization Bills */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-medium text-gray-900">
                          Pending Organization Bills
                        </h3>
                      </div>

                      <div className="text-2xl font-bold text-orange-600">
                        {pendingOrgOrders.length}
                      </div>

                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {pendingOrgOrders.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No pending bills
                          </p>
                        ) : (
                          pendingOrgOrders.slice(0, 3).map((order) => (
                            <div
                              key={order.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="truncate">#{order.orderId}</span>
                              <span className="font-medium">
                                ��{order.total}
                              </span>
                            </div>
                          ))
                        )}
                        {pendingOrgOrders.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{pendingOrgOrders.length - 3} more...
                          </p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab("orders")}
                      >
                        Manage Bills
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics.totalOrders}
                      </div>
                      <div className="text-xs text-gray-500">Total Orders</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {analytics.pendingOrders}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pending Orders
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {analytics.organizationOrders}
                      </div>
                      <div className="text-xs text-gray-500">Org. Orders</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        ₹
                        {Math.round(
                          analytics.totalRevenue /
                            Math.max(analytics.totalOrders, 1),
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Avg. Order</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Menu Management
                  </h2>
                  {loadingMenuItems && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading menu data...
                    </div>
                  )}
                </div>

                {/* Canteen Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCanteens.map((canteen) => {
                    const canteenItems = menuItems[canteen.id] || [];
                    const totalItems = canteenItems.length;
                    const availableItems = canteenItems.filter(
                      (item) => item.isAvailable && item.quantity > 0,
                    ).length;

                    return (
                      <Card key={canteen.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">
                            {canteen.name}
                          </h3>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() =>
                              openAddItemModal(canteen.id, canteen.name)
                            }
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {loadingMenuItems ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                              ) : (
                                totalItems
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Menu Items
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {loadingMenuItems ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                              ) : (
                                availableItems
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Available
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewMenuItems(canteen.id)}
                        >
                          Manage Items
                        </Button>
                      </Card>
                    );
                  })}
                </div>

                {/* Menu Items List */}
                {selectedCanteenForMenu && (
                  <div className="mt-8">
                    <MenuItemsList
                      canteenId={selectedCanteenForMenu}
                      canteenName={
                        availableCanteens.find(
                          (c) => c.id === selectedCanteenForMenu,
                        )?.name || "Canteen"
                      }
                    />
                  </div>
                )}

                {availableCanteens.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No canteens assigned to your account.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Contact your administrator for access.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-2">Pending Orders</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      8
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Orders awaiting approval
                    </p>
                    <Button className="w-full">View Details</Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-2">
                      Organization Bills
                    </h3>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      3
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Bulk orders for approval
                    </p>
                    <Button variant="outline" className="w-full">
                      Review Bills
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-2">
                      Today's Revenue
                    </h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ₹12,450
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      From completed orders
                    </p>
                    <Button variant="outline" className="w-full">
                      View Report
                    </Button>
                  </Card>
                </div>
              </div>
            )}


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {availableCanteens.map((canteen) => {
                        const canteenItems = menuItems[canteen.id] || [];
                        const totalItems = canteenItems.length;
                        const availableItems = canteenItems.filter(
                          (item) => item.isAvailable && item.quantity > 0,
                        ).length;

                        return (
                          <Card key={canteen.id} className="p-6">
                            <h3 className="text-lg font-medium mb-4">
                              {canteen.name}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                  {loadingMenuItems ? (
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                  ) : (
                                    totalItems
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Menu Items
                                </div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                  {loadingMenuItems ? (
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                  ) : (
                                    availableItems
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Available
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleViewMenuItems(canteen.id)}
                              >
                                Manage Items
                              </Button>
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() =>
                                  openAddItemModal(canteen.id, canteen.name)
                                }
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Item
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    {availableCanteens.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No canteens assigned to your account.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Contact your administrator for access.
                        </p>
                      </div>
                    )}

                    {/* Menu Items List */}
                    {selectedCanteenForMenu && (
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedCanteenForMenu(null)}
                          >
                            ← Back to Canteens
                          </Button>
                        </div>
                        <MenuItemsList
                          canteenId={selectedCanteenForMenu}
                          canteenName={
                            availableCanteens.find(
                              (c) => c.id === selectedCanteenForMenu,
                            )?.name || "Canteen"
                          }
                        />
                      </div>
                    )}
              </div>
            )}
            {activeTab === "qr" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    QR Code Management
                  </h2>
                  <div className="text-sm text-gray-500">
                    Manage payment QR codes for assigned canteens
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCanteens.map((canteen) => (
                    <Card key={canteen.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{canteen.name}</h3>
                        <Badge
                          variant={
                            qrCodes[canteen.id] ? "default" : "secondary"
                          }
                        >
                          {qrCodes[canteen.id] ? "Active" : "No QR"}
                        </Badge>
                      </div>

                      <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border">
                        {qrCodes[canteen.id] ? (
                          <img
                            src={qrCodes[canteen.id]}
                            alt={`${canteen.name} QR Code`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              No QR uploaded
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => openQRUpload(canteen.id, canteen.name)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {qrCodes[canteen.id]
                            ? "Update QR Code"
                            : "Upload QR Code"}
                        </Button>
                        {qrCodes[canteen.id] && (
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview QR
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                {availableCanteens.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No canteens assigned to your account.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Contact your administrator for QR management access.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    QR Code Best Practices:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Upload high-quality, clear QR codes</li>
                    <li>
                      • Test QR codes before uploading to ensure they work
                    </li>
                    <li>• Include payment instructions with order details</li>
                    <li>
                      • Update QR codes immediately if payment details change
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* QR Upload Modal */}
      <QRUploadModal
        isOpen={qrUploadModal.isOpen}
        onClose={closeQRUpload}
        canteenId={qrUploadModal.canteenId}
        canteenName={qrUploadModal.canteenName}
        onUpload={handleQRUpload}
      />

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={menuModal.isOpen}
        onClose={closeMenuModal}
        onSuccess={handleMenuModalSuccess}
        canteenId={menuModal.canteenId}
        canteenName={menuModal.canteenName}
      />
    </div>
  );
}