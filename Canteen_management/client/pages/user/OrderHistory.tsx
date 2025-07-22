import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeedbackModal from "@/components/FeedbackModal";
import { orderAPI } from "@/lib/api";
import type { Order } from "@shared/api";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  User,
  LogOut,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

export default function OrderHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const username = user?.username || "User";
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    orderId: string;
  }>({
    isOpen: false,
    orderId: "",
  });

  // Get new order from navigation state (if redirected from payment)
  const newOrder = location.state?.newOrder;

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await orderAPI.getMyOrders();
      setOrders(response.orders);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load order history from database.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const handleBack = () => {
    navigate("/user/canteens");
  };

  // Helper function to format date and time
  const formatDateTime = (order: Order | any) => {
    if (order.orderDate && order.orderTime) {
      const date = new Date(order.orderDate);
      return {
        date: date.toLocaleDateString("en-IN"),
        time: order.orderTime,
      };
    }
    // Fallback for legacy order format
    if (order.date && order.time) {
      return {
        date: order.date,
        time: order.time,
      };
    }
    // Fallback to createdAt if new fields not available
    if (order.createdAt) {
      const createdAt = new Date(order.createdAt);
      return {
        date: createdAt.toLocaleDateString("en-IN"),
        time: createdAt.toLocaleTimeString("en-IN", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
    // Final fallback
    const now = new Date();
    return {
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getCanteenName = (order: Order | any) => {
    if (order.canteenId === "canteen-a") return "Campus Canteen A";
    if (order.canteenId === "canteen-b") return "Guest House Canteen";
    return order.canteen || "Unknown Canteen";
  };

  const displayOrders = orders;

  const handleFeedback = (orderId: string) => {
    setFeedbackModal({ isOpen: true, orderId });
  };

  const handleFeedbackClose = () => {
    setFeedbackModal({ isOpen: false, orderId: "" });
  };

  const handleFeedbackSubmit = (
    orderId: string,
    rating: number,
    comment: string,
    recommend: boolean,
  ) => {
    console.log("Feedback submitted:", { orderId, rating, comment, recommend });
    // In real app, this would update the order in the database
    handleFeedbackClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1 h-8 w-8 hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=200"
                alt="CSIR CRRI Logo"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold">Order History</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading your order history...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-yellow-700 mb-2">{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchOrders}
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* New Order Confirmation */}
          {newOrder && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">
                    Order{" "}
                    {newOrder.status === "pending" ? "Submitted" : "Confirmed"}
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  Your order has been{" "}
                  {newOrder.status === "pending"
                    ? "submitted for approval"
                    : "confirmed"}
                  . Order ID: {newOrder.id}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {!isLoading &&
            displayOrders.map((order) => {
              const { date, time } = formatDateTime(order);
              const canteenName = getCanteenName(order);
              const orderItems = Array.isArray(order.items)
                ? order.items.map((item: any) =>
                    typeof item === "string"
                      ? item
                      : item.name || item.menuItem,
                  )
                : [];

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Order #{order.orderId || order.id}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {date} at {time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {canteenName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.orderType || order.type}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Items Ordered:</h4>
                        <div className="flex flex-wrap gap-2">
                          {orderItems.map((item: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="font-medium text-lg">
                            ₹{order.total}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Total
                          </span>
                        </div>

                        {order.status === "completed" && (
                          <div className="flex items-center gap-2">
                            {(order as any).rating ? (
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= ((order as any).rating || 0)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground ml-1">
                                  Rated
                                </span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFeedback(order.id)}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Rate & Review
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {(order as any).feedback && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm italic">
                            "{(order as any).feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {/* Empty State */}
          {!isLoading &&
            !error &&
            orders.length === 0 &&
            displayOrders.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by placing your first order from the canteen
                  </p>
                  <Button onClick={handleBack}>Browse Menu</Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={handleFeedbackClose}
        onSubmit={handleFeedbackSubmit}
        orderId={feedbackModal.orderId}
      />
    </div>
  );
}
