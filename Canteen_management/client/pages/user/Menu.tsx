import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  LogOut,
  ArrowLeft,
  Clock,
  MapPin,
  Car,
  Coffee,
  Loader2,
} from "lucide-react";
import { menuAPI, handleAPIError, canteenAPI } from "@/lib/api";
import type { MenuItem } from "@shared/api";

export default function Menu() {
  const { canteenId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const username = user?.username || "User";
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">(
    "takeaway",
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canteenList, setCanteenList] = useState<any[]>([]);

  const canteenName =
    canteenId === "canteen-a" ? "Campus Canteen A" : "Guest House Canteen";

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!canteenId) return;

      try {
        setLoading(true);
        setError(null);
        const items = await menuAPI.getByCanteen(canteenId, {
          available: true,
        });
        setMenuItems(items);
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [canteenId]);

  // Fetch canteen list for mapping alias to ObjectId
  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const canteens = await canteenAPI.getAll();
        setCanteenList(canteens);
      } catch (err) {
        console.error("Failed to fetch canteen list", err);
      }
    };
    fetchCanteens();
  }, []);

  // Debug logs to diagnose cart and menuItems issues
  useEffect(() => {
    console.log("menuItems", menuItems);
    console.log("cart", cart);
  }, [menuItems, cart]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even if logout fails
      navigate("/");
    }
  };

  const handleBack = () => {
    navigate("/user/canteens");
  };

  const updateCart = useCallback((itemId: string, change: number) => {
    setCart((prev) => {
      const newQuantity = (prev[itemId] || 0) + change;
      if (newQuantity <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  }, []);

  // Memoize cart calculations for better performance
  const { totalItems, totalAmount } = useMemo(() => {
    const items = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const amount = Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find((i) => i._id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
    return { totalItems: items, totalAmount: amount };
  }, [cart, menuItems]);

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
              <div>
                <h1 className="text-xl font-bold">{canteenName}</h1>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {canteenId === "canteen-a"
                      ? "Main Campus Building"
                      : "Guest House Complex"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Open
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Welcome, {username}</Badge>
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Menu */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Menu Items</h2>
                <p className="text-muted-foreground">
                  All available items from {canteenName}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">
                    Loading menu items...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <UtensilsCrossed className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Failed to load menu</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {error}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <h3 className="font-medium text-lg mb-2">
                    No menu items available
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    The admin hasn't added any menu items yet for {canteenName}.
                  </p>
                  <p className="text-sm text-blue-600">
                    💡 This system uses real-time data from admin entries - no
                    demo items are shown.
                  </p>
                </div>
              ) : (
                menuItems.map((item) => (
                  <Card
                    key={item._id}
                    className={!item.isAvailable ? "opacity-60" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            {!item.isAvailable && (
                              <Badge variant="destructive" className="text-xs">
                                Out of Stock
                              </Badge>
                            )}
                            {item.quantity < 10 && item.isAvailable && (
                              <Badge
                                variant="outline"
                                className="text-xs border-orange-200 text-orange-700"
                              >
                                Limited ({item.quantity} left)
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description || "Delicious item from our menu"}
                          </p>
                          <p className="font-bold text-primary">
                            ₹{item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cart[item._id] ? (
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => updateCart(item._id, -1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {cart[item._id]}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => updateCart(item._id, 1)}
                                disabled={
                                  !item.isAvailable ||
                                  cart[item._id] >= item.quantity
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => updateCart(item._id, 1)}
                              disabled={
                                !item.isAvailable || item.quantity === 0
                              }
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Your Order
                </CardTitle>
                {totalItems > 0 && (
                  <CardDescription>
                    {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {totalItems === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your cart is empty</p>
                    <p className="text-sm">Add items from the menu</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {Object.entries(cart).map(([itemId, qty]) => {
                        const item = menuItems.find((i) => i._id === itemId);
                        if (!item) return null;
                        return (
                          <div
                            key={itemId}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-muted-foreground">
                                ₹{item.price} × {qty}
                              </div>
                            </div>
                            <div className="font-medium">
                              ₹{item.price * qty}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between font-bold">
                        <span>Total</span>
                        <span>₹{totalAmount}</span>
                      </div>
                    </div>

                    {/* Order Type Selection */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Order Type</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={
                              orderType === "dine-in" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setOrderType("dine-in")}
                            className="flex items-center gap-2"
                          >
                            <Coffee className="w-4 h-4" />
                            Dine In
                          </Button>
                          <Button
                            variant={
                              orderType === "takeaway" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setOrderType("takeaway")}
                            className="flex items-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            Takeaway
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {orderType === "dine-in"
                            ? "Enjoy your meal at the canteen tables"
                            : "Pack your order for takeaway"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          // Prepare order data
                          const orderItems = Object.entries(cart).map(
                            ([itemId, qty]) => {
                              const item = menuItems.find(
                                (i) => i._id === itemId,
                              );
                              return {
                                name: item?.name || "Unknown Item",
                                quantity: qty,
                                price: item?.price || 0,
                                menuItemId: itemId, // Proper menu item ID for Razorpay
                              };
                            },
                          );

                          const realCanteen = canteenList.find(
                            (c) => c.alias === canteenId || c.name === canteenName
                          );
                          const realCanteenId = realCanteen?._id || canteenId;
                          const orderData = {
                            orderId: `ORD-${Date.now()}`,
                            canteenId: realCanteenId,
                            canteenName,
                            items: orderItems,
                            total: totalAmount,
                            orderType: orderType, // Now using selected order type
                          };

                          // Navigate to payment page
                          navigate("/user/payment", { state: { orderData } });
                        }}
                      >
                        Proceed to Checkout
                      </Button>
                      <p className="text-xs text-center text-blue-600">
                        💫 Rate your experience after delivery and help us
                        improve!
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
