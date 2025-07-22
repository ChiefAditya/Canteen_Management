import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";
import { orderAPI, handleAPIError } from "@/lib/api";
import type { Order } from "@shared/api";

interface RevenueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MonthlyStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  individualPayments: number;
  organizationPayments: number;
  completedOrders: number;
  dailyStats: { date: string; revenue: number; orders: number }[];
}

export default function RevenueReportModal({
  isOpen,
  onClose,
}: RevenueReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
      });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  // Fetch revenue data for selected month
  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [year, month] = selectedMonth.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Fetch orders for the selected month
      const data = await orderAPI.getAll({
        limit: 1000, // Get all orders for the month
      });

      // Filter orders for the selected month and completed orders
      const monthOrders = data.orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        return orderMonth === selectedMonth && order.status === "completed";
      });

      // Calculate statistics
      const totalRevenue = monthOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      const totalOrders = monthOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const individualPayments = monthOrders.filter(
        (order) => order.paymentType === "individual",
      ).length;
      const organizationPayments = monthOrders.filter(
        (order) => order.paymentType === "organization",
      ).length;

      // Calculate daily stats
      const dailyStatsMap = new Map<
        string,
        { revenue: number; orders: number }
      >();

      monthOrders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split("T")[0];
        const existing = dailyStatsMap.get(date) || { revenue: 0, orders: 0 };
        dailyStatsMap.set(date, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1,
        });
      });

      const dailyStats = Array.from(dailyStatsMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setMonthlyStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        individualPayments,
        organizationPayments,
        completedOrders: totalOrders,
        dailyStats,
      });
    } catch (err) {
      console.error("Failed to fetch revenue data:", err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRevenueData();
    }
  }, [isOpen, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const maxDailyRevenue =
    monthlyStats?.dailyStats.reduce(
      (max, day) => Math.max(max, day.revenue),
      0,
    ) || 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Revenue Report
          </DialogTitle>
          <DialogDescription>
            Detailed revenue analysis and insights from completed orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Month Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium">Select Month:</label>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRevenueData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading revenue data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Revenue Statistics */}
          {!loading && !error && monthlyStats && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-800">
                      {formatCurrency(monthlyStats.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700">
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-800">
                      {monthlyStats.totalOrders}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-700">
                      Avg Order Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-800">
                      {formatCurrency(Math.round(monthlyStats.avgOrderValue))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-700">
                      Daily Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-800">
                      {formatCurrency(
                        Math.round(
                          monthlyStats.totalRevenue /
                            Math.max(monthlyStats.dailyStats.length, 1),
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Payment Type Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {monthlyStats.individualPayments}
                      </div>
                      <div className="text-sm text-gray-600">
                        Individual Payments
                      </div>
                      <div className="text-xs text-gray-500">
                        {monthlyStats.totalOrders > 0
                          ? Math.round(
                              (monthlyStats.individualPayments /
                                monthlyStats.totalOrders) *
                                100,
                            )
                          : 0}
                        % of total orders
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {monthlyStats.organizationPayments}
                      </div>
                      <div className="text-sm text-gray-600">
                        Organization Bills
                      </div>
                      <div className="text-xs text-gray-500">
                        {monthlyStats.totalOrders > 0
                          ? Math.round(
                              (monthlyStats.organizationPayments /
                                monthlyStats.totalOrders) *
                                100,
                            )
                          : 0}
                        % of total orders
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Daily Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyStats.dailyStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No revenue data available for this month.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-40 flex items-end gap-1 overflow-x-auto">
                        {monthlyStats.dailyStats.map((day, index) => (
                          <div
                            key={day.date}
                            className="flex-shrink-0 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-8 bg-green-500 rounded-sm transition-all duration-300 hover:bg-green-600"
                              style={{
                                height: `${Math.max((day.revenue / maxDailyRevenue) * 140, 4)}px`,
                              }}
                              title={`${new Date(day.date).toLocaleDateString("en-IN")}: ${formatCurrency(day.revenue)} (${day.orders} orders)`}
                            />
                            <span className="text-xs text-gray-500 rotate-45 origin-center">
                              {new Date(day.date).getDate()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Daily revenue for{" "}
                        {
                          monthOptions.find((m) => m.value === selectedMonth)
                            ?.label
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {monthlyStats && (
              <div className="text-sm text-gray-600">
                Report for{" "}
                {monthOptions.find((m) => m.value === selectedMonth)?.label} •{" "}
                {monthlyStats.totalOrders} completed orders •{" "}
                {formatCurrency(monthlyStats.totalRevenue)} total revenue
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
