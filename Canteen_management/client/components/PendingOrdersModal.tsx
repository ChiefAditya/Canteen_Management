import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  ClipboardList,
  Check,
  X,
  Calendar,
  User,
  MapPin,
  Filter,
} from "lucide-react";
import { orderAPI, handleAPIError } from "@/lib/api";
import type { Order } from "@shared/api";

interface PendingOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void; // Callback to refresh parent data
}

export default function PendingOrdersModal({
  isOpen,
  onClose,
  onStatusUpdate,
}: PendingOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "individual" | "organization"
  >("all");

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getAll({
        status: "pending",
        limit: 100,
      });
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to fetch pending orders:", err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingOrders();
    }
  }, [isOpen]);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: "approved" | "rejected" | "completed",
    notes?: string,
  ) => {
    try {
      setUpdatingOrder(orderId);
      await orderAPI.updateStatus(orderId, newStatus, notes);
      await fetchPendingOrders(); // Refresh the list
      onStatusUpdate?.(); // Notify parent to refresh
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status: " + handleAPIError(err));
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Filter orders based on payment type
  const filteredOrders = orders.filter((order) => {
    if (filterType === "all") return true;
    return order.paymentType === filterType;
  });

  const totalOrderAmount = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Pending Orders Management
          </DialogTitle>
          <DialogDescription>
            Review and manage all pending orders awaiting approval or
            completion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter and Summary */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="individual">Individual Payment</option>
                <option value="organization">Organization Billing</option>
              </select>
            </div>

            <Card className="bg-blue-50 border-blue-200 p-3">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-700">
                    Pending Orders
                  </div>
                  <div className="text-xl font-bold text-blue-800">
                    {filteredOrders.length}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-700">Total Value</div>
                  <div className="text-xl font-bold text-blue-800">
                    ₹{totalOrderAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading pending orders...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Orders List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Pending Orders</h3>
                  <p className="text-sm">
                    {filterType === "all"
                      ? "All orders have been processed."
                      : `No pending ${filterType} orders found.`}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`border-l-4 ${
                      order.paymentType === "organization"
                        ? "border-l-orange-400"
                        : "border-l-blue-400"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            #{order.orderId}
                            <Badge variant="outline" className="text-xs">
                              {order.orderType}
                            </Badge>
                            <Badge
                              variant={
                                order.paymentType === "organization"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                order.paymentType === "organization"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {order.paymentType === "organization"
                                ? "Org Billing"
                                : "Individual"}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              User ID: {order.userId}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.canteenId === "canteen-a"
                                ? "Campus Canteen A"
                                : "Guest House Canteen"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{order.total}
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Order Items */}
                      <div className="space-y-2 mb-4">
                        <h4 className="font-medium text-sm">Ordered Items:</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-1"
                            >
                              <span className="text-sm">
                                {item.menuItem.name} × {item.quantity}
                              </span>
                              <span className="text-sm font-medium">
                                ₹
                                {(
                                  item.menuItem.price * item.quantity
                                ).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              "approved",
                              "Order approved by admin",
                            )
                          }
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              "completed",
                              "Order completed",
                            )
                          }
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              "rejected",
                              "Order rejected by admin",
                            )
                          }
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <X className="w-4 h-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {filteredOrders.length > 0 && (
              <div className="text-sm text-gray-600">
                {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""} pending • Total: ₹
                {totalOrderAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
