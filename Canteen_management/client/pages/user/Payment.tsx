import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  CheckCircle,
  Loader2,
  AlertCircle,
  Copy,
  Download,
  User,
  LogOut,
  Zap,
} from "lucide-react";
import { orderAPI, handleAPIError } from "@/lib/api";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderData {
  canteenId: string;
  canteenName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  orderType: "dine-in" | "takeaway";
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const orderData = location.state?.orderData as OrderData;

  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "razorpay" | "qr" | "organization"
  >("razorpay");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // QR codes from database
  const qrCodes = {
    "canteen-a": localStorage.getItem("qr-canteen-a"),
    "canteen-b": localStorage.getItem("qr-canteen-b"),
  };

  const qrCode = qrCodes[orderData?.canteenId as keyof typeof qrCodes];

  useEffect(() => {
    if (!orderData) {
      navigate("/user/canteens");
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [orderData, navigate]);

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      setRazorpayLoading(true);
      setPaymentError(null);

      // Get canteen-specific Razorpay configuration
      const configResponse = await fetch(
        `/api/payment/razorpay-config/${orderData.canteenId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      const configData = await configResponse.json();
      if (!configData.success) {
        throw new Error(
          configData.message || "Razorpay not configured for this canteen",
        );
      }

      // Create Razorpay order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          amount: orderData.total,
          orderData: {
            ...orderData,
            items: orderData.items.map((item) => ({
              ...item,
              menuItemId: item.menuItemId || item.name, // Ensure we have menu item ID
            })),
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create payment order");
      }

      // Initialize Razorpay with canteen-specific configuration
      const options = {
        key: data.data.key,
        amount: data.data.amount,
        currency: data.data.currency,
        name: `CSIR CRRI - ${data.data.canteenName}`,
        description: `Order from ${orderData.canteenName}`,
        order_id: data.data.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: data.data.transactionId,
                orderData,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setOrderCompleted(true);
              setTimeout(() => {
                navigate("/user/orders", {
                  state: {
                    newOrder: {
                      id: verifyData.data.orderId,
                      ...orderData,
                      status: "completed",
                      paymentMethod: "razorpay",
                      paymentId: verifyData.data.paymentId,
                    },
                  },
                });
              }, 2000);
            } else {
              throw new Error(
                verifyData.message || "Payment verification failed",
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentError(
              error instanceof Error
                ? error.message
                : "Payment verification failed",
            );
          }
        },
        modal: {
          ondismiss: () => {
            setRazorpayLoading(false);
          },
        },
        prefill: {
          name: user?.fullName || user?.username,
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          canteen: orderData.canteenName,
          orderType: orderData.orderType,
        },
        theme: {
          color: "#1f2937", // Primary color
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay payment error:", error);
      setPaymentError(
        error instanceof Error ? error.message : "Payment failed",
      );
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    if (paymentMethod === "qr" && !paymentConfirmed) {
      // For QR payment, show proof submission step
      setShowPaymentProof(true);
      return;
    }

    setOrderProcessing(true);

    try {
      // Create the order through API
      const orderPayload = {
        canteenId: orderData.canteenId,
        items: orderData.items.map((item) => ({
          menuItem: item.menuItemId || item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        orderType: orderData.orderType,
        paymentType:
          paymentMethod === "organization" ? "organization" : "individual",
        notes:
          paymentMethod === "qr"
            ? "Payment made via QR code"
            : "Organization billing request",
      };

      const response = await orderAPI.create(orderPayload);

      setOrderProcessing(false);
      setOrderCompleted(true);

      // Redirect to order confirmation after 2 seconds
      setTimeout(() => {
        navigate("/user/orders", {
          state: {
            newOrder: {
              ...response,
              ...orderData,
              status:
                paymentMethod === "organization" ? "pending" : "completed",
              paymentMethod,
            },
          },
        });
      }, 2000);
    } catch (error) {
      setOrderProcessing(false);
      console.error("Failed to create order:", error);
      setPaymentError(handleAPIError(error));
    }
  };

  const handlePaymentConfirmation = () => {
    setPaymentConfirmed(true);
    setShowPaymentProof(false);
    handlePayment();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (!orderData) {
    return <div>Loading...</div>;
  }

  // Payment Proof Modal
  if (showPaymentProof) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=200"
                  alt="CSIR CRRI Logo"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold">Payment Confirmation</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.username}</span>
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

        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                Payment Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Please confirm that you have completed the payment via QR
                  code.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Payment Instructions:
                  </h4>
                  <ol className="text-sm text-yellow-700 text-left space-y-1">
                    <li>1. Scan the QR code with your payment app</li>
                    <li>2. Complete the payment of ₹{orderData.total}</li>
                    <li>3. Take a screenshot of the payment confirmation</li>
                    <li>4. Click "Payment Completed" below</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handlePaymentConfirmation}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Payment Completed
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentProof(false)}
                    className="w-full"
                  >
                    Back to Payment
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Your order will be processed after payment confirmation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center pt-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground mb-4">
              Your order has been{" "}
              {paymentMethod === "organization"
                ? "submitted for approval"
                : "confirmed and will be prepared"}
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to order history...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onClick={() => navigate(-1)}
                className="p-1 h-8 w-8 hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=200"
                alt="CSIR CRRI Logo"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold">Payment</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.username}</span>
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      {orderData.canteenName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Order Type:{" "}
                      {orderData.orderType === "dine-in"
                        ? "Dine In"
                        : "Takeaway"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-2">
                            × {item.quantity}
                          </span>
                        </div>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{orderData.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(
                        value as "razorpay" | "qr" | "organization",
                      )
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger
                        value="razorpay"
                        className="flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Razorpay
                      </TabsTrigger>
                      <TabsTrigger
                        value="qr"
                        className="flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </TabsTrigger>
                      <TabsTrigger
                        value="organization"
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Organization
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="razorpay" className="space-y-4 mt-6">
                      <div className="text-center space-y-4">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                              <Zap className="w-8 h-8 text-white" />
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Secure Online Payment
                          </h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Pay securely using UPI, Cards, Net Banking, or
                            Wallets
                          </p>

                          <div className="bg-white p-4 rounded border border-blue-100">
                            <div className="flex items-center justify-between text-lg font-bold text-blue-900">
                              <span>Total Amount:</span>
                              <span>₹{orderData.total}</span>
                            </div>
                          </div>
                        </div>

                        {paymentError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{paymentError}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-3">
                          <Button
                            onClick={handlePayment}
                            disabled={razorpayLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                          >
                            {razorpayLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Opening Razorpay...
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Pay ₹{orderData.total} via Razorpay
                              </>
                            )}
                          </Button>

                          <div className="text-xs text-gray-500 space-y-1">
                            <p>✓ 100% Secure and Encrypted</p>
                            <p>✓ Supports UPI, Cards, Net Banking & Wallets</p>
                            <p>✓ Instant payment confirmation</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="qr" className="space-y-4 mt-6">
                      {qrCode ? (
                        <div className="text-center space-y-4">
                          <div className="inline-block p-4 bg-white rounded-lg border">
                            <img
                              src={qrCode}
                              alt="Payment QR Code"
                              className="w-48 h-48 mx-auto"
                            />
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">
                              Scan to Pay ₹{orderData.total}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Use any UPI app to scan and pay
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(qrCode)}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy QR
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = qrCode;
                                link.download = `qr-${orderData.canteenName}.png`;
                                link.click();
                              }}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>

                          <Button
                            onClick={handlePayment}
                            disabled={orderProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {orderProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm Payment
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            QR code not available for this canteen. Please
                            contact the administrator or use organization
                            billing.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent
                      value="organization"
                      className="space-y-4 mt-6"
                    >
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">
                          Organization Billing
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          This order will be billed to your organization and
                          requires approval from the finance team.
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Employee ID:</span>
                            <span className="font-medium">
                              {user?.employeeId || user?.username}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Department:</span>
                            <span className="font-medium">
                              {user?.department || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Order Amount:</span>
                            <span className="font-medium">
                              ₹{orderData.total}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handlePayment}
                        disabled={orderProcessing}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {orderProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Submit for Organization Billing
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Your order will be pending until approved by finance
                        team
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
