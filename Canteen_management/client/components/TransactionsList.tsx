import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { handleAPIError } from "@/lib/api";

interface Transaction {
  _id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  paymentMethod: "razorpay" | "qr" | "organization";
  canteenId: string;
  userId: {
    username: string;
    fullName?: string;
    employeeId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TransactionSummary {
  totalRevenue: number;
  todayRevenue: number;
  totalTransactions: number;
}

interface TransactionsListProps {
  onClose: () => void;
}

export default function TransactionsList({ onClose }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<TransactionSummary>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalTransactions: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [canteenFilter, setCanteenFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (canteenFilter !== "all") params.append("canteenId", canteenFilter);

      const response = await fetch(`/api/payment/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch transactions");
      }

      setTransactions(data.data.transactions);
      setSummary(data.data.summary);
      setTotalPages(data.data.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, canteenFilter]);

  // Filter transactions locally for search
  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.orderId.toLowerCase().includes(searchLower) ||
      transaction.userId.username.toLowerCase().includes(searchLower) ||
      (transaction.userId.fullName &&
        transaction.userId.fullName.toLowerCase().includes(searchLower)) ||
      (transaction.razorpayPaymentId &&
        transaction.razorpayPaymentId.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "created":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "razorpay":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Razorpay
          </Badge>
        );
      case "qr":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            QR Code
          </Badge>
        );
      case "organization":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            Organization
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (canteenFilter !== "all") params.append("canteenId", canteenFilter);
      params.append("limit", "1000"); // Get all for export

      const response = await fetch(`/api/payment/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Create CSV
        const csv = [
          "Order ID,Payment ID,User,Amount,Status,Payment Method,Canteen,Date",
          ...data.data.transactions.map((t: Transaction) =>
            [
              t.orderId,
              t.razorpayPaymentId || "N/A",
              t.userId.fullName || t.userId.username,
              `₹${t.amount}`,
              t.status,
              t.paymentMethod,
              t.canteenId,
              formatDate(t.createdAt),
            ].join(","),
          ),
        ].join("\n");

        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export transactions:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onClose} className="mb-4">
            ← Back to QR Management
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            Payment Transactions
          </h2>
          <p className="text-gray-600">
            View and manage all payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportTransactions} size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{summary.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{summary.todayRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.totalTransactions}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="created">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={canteenFilter} onValueChange={setCanteenFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Canteen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Canteens</SelectItem>
                <SelectItem value="canteen-a">Campus Canteen A</SelectItem>
                <SelectItem value="canteen-b">Guest House Canteen</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCanteenFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : "No payment transactions yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="font-medium">
                        {transaction.orderId}
                        {transaction.razorpayPaymentId && (
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.razorpayPaymentId}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.userId.fullName ||
                              transaction.userId.username}
                          </p>
                          {transaction.userId.employeeId && (
                            <p className="text-xs text-gray-500">
                              ID: {transaction.userId.employeeId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{transaction.amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodBadge(transaction.paymentMethod)}
                      </TableCell>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
