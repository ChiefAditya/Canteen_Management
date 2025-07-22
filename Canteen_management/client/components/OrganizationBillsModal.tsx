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
  FileText,
  Check,
  X,
  Calendar,
  User,
  MapPin,
} from "lucide-react";
import { orderAPI, handleAPIError } from "@/lib/api";
import type { Order } from "@shared/api";

interface OrganizationBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void; // Callback to refresh parent data
}

export default function OrganizationBillsModal({
  isOpen,
  onClose,
  onStatusUpdate,
}: OrganizationBillsModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Fetch pending organization orders
  const fetchOrganizationBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getAll({
        paymentType: "organization",
        status: "pending",
        limit: 100,
      });
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to fetch organization bills:", err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrganizationBills();
    }
  }, [isOpen]);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: "approved" | "rejected",
    notes?: string,
  ) => {
    try {
      setUpdatingOrder(orderId);
      await orderAPI.updateStatus(orderId, newStatus, notes);
      await fetchOrganizationBills(); // Refresh the list
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

  const totalBillAmount = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Organization Bills Review
          </DialogTitle>
          <DialogDescription>
            Review and approve pending organization bills. These orders are
            billed to the organization account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-orange-800">
                Bills Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-orange-700">Total Bills</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {orders.length}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-orange-700">
                    Total Amount
                  </div>
                  <div className="text-2xl font-bold text-orange-800">
                    ₹{totalBillAmount.toLocaleString()}
                  </div>
                </div>
                <div className="md:col-span-1 col-span-2">
                  <div className="font-medium text-orange-700">Status</div>
                  <div className="text-sm text-orange-600">
                    Awaiting Admin Approval
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading organization bills...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Bills List */}
          {!loading && !error && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Pending Bills</h3>
                  <p className="text-sm">
                    All organization bills have been processed.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card
                    key={order.id}
                    className="border-l-4 border-l-orange-400"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            #{order.orderId}
                            <Badge variant="outline" className="text-xs">
                              {order.orderType}
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
                          <div className="text-2xl font-bold text-orange-600">
                            ₹{order.total}
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            Organization Bill
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
                              "Approved for organization billing",
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
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              "rejected",
                              "Rejected - organization billing not approved",
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
            {orders.length > 0 && (
              <div className="text-sm text-gray-600">
                {orders.length} bill{orders.length !== 1 ? "s" : ""} pending
                approval • Total: ₹{totalBillAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
