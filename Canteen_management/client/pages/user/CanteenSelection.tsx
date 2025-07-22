import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UtensilsCrossed,
  MapPin,
  Clock,
  Star,
  LogOut,
  ArrowRight,
  ClipboardList,
  Heart,
  ShoppingCart,
  Plus,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { orderAPI, menuAPI, handleAPIError } from "@/lib/api";
import type { Order, MenuItem } from "@shared/api";

export default function CanteenSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const username = user?.username || "User";

  // State for recent orders and favorites
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<
    (MenuItem & { orderCount: number })[]
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);

  // Fetch recent orders (last 4)
  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderAPI.getMyOrders({ limit: 4 });
      setRecentOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to fetch recent orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Calculate favorite items based on most ordered
  const fetchFavoriteItems = async () => {
    try {
      setLoadingFavorites(true);

      // Get all user's orders to calculate most ordered items
      const allOrdersResponse = await orderAPI.getMyOrders({ limit: 100 });
      const allOrders = allOrdersResponse.orders || [];

      // Count occurrences of each menu item
      const itemCounts: { [key: string]: { count: number; item: any } } = {};

      for (const order of allOrders) {
        for (const orderItem of order.items) {
          const itemId = orderItem.menuItem || orderItem.id;
          if (itemCounts[itemId]) {
            itemCounts[itemId].count += orderItem.quantity;
          } else {
            itemCounts[itemId] = {
              count: orderItem.quantity,
              item: orderItem,
            };
          }
        }
      }

      // Get top 4 most ordered items
      const sortedItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Fetch current menu item details for these items
      const favoriteItemsWithDetails = [];

      for (const { count, item } of sortedItems) {
        try {
          // Try to get fresh menu item data
          const canteenMenus = await Promise.all([
            menuAPI.getAll({ canteenId: "canteen-a" }),
            menuAPI.getAll({ canteenId: "canteen-b" }),
          ]);

          const allMenuItems = [...canteenMenus[0], ...canteenMenus[1]];
          const menuItem = allMenuItems.find(
            (mi) =>
              mi.id === (item.menuItem || item.id) || mi.name === item.name,
          );

          if (menuItem) {
            favoriteItemsWithDetails.push({
              ...menuItem,
              orderCount: count,
            });
          } else {
            // Fallback to order item data
            favoriteItemsWithDetails.push({
              id: item.menuItem || item.id || Math.random().toString(),
              name: item.name,
              price: item.price,
              category: "main",
              description: "Previously ordered item",
              canteenId: "canteen-a",
              isAvailable: true,
              quantity: 10,
              orderCount: count,
            });
          }
        } catch (error) {
          console.error("Failed to fetch menu item details:", error);
        }
      }

      setFavoriteItems(favoriteItemsWithDetails);
    } catch (error) {
      console.error("Failed to fetch favorite items:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRecentOrders();
    fetchFavoriteItems();
  }, []);

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

  const handleCanteenSelect = (canteenId: string) => {
    localStorage.setItem("selectedCanteen", canteenId); // ObjectId
    navigate(`/user/menu/${canteenId}`); // ObjectId in URL
  };

  // Add item to cart (navigate to menu with item pre-selected)
  const handleAddToCart = async (item: MenuItem & { orderCount: number }) => {
    try {
      setAddingToCart(item.id!);

      // Store the item in localStorage for the menu page to pick up
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        canteenId: item.canteenId,
        menuItemId: item.id, // Ensure proper menu item ID
      };

      localStorage.setItem("pendingCartItem", JSON.stringify(cartItem));
      localStorage.setItem("selectedCanteen", item.canteenId.toString());

      // Show success message
      setCartSuccess(item.id!);
      setTimeout(() => setCartSuccess(null), 2000);

      // Navigate to menu page
      setTimeout(() => {
        navigate(`/user/menu/${item.canteenId}`);
      }, 1000);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  // Replace these with your actual ObjectIds from the database
  const canteens = [
    {
      id: "6875fe1c68e07f702a177b6d", // ObjectId for Campus Canteen A
      alias: "canteen-a",
      name: "Campus Canteen A",
      location: "Main Campus Building",
      timing: "8:00 AM - 5:00 PM",
      rating: 4.5,
      status: "Open",
      specialties: ["North Indian", "South Indian", "Snacks"],
      waitTime: "5-10 mins",
      distance: "200m",
    },
    {
      id: "6875fe1c68e07f702a177b6e", // ObjectId for Guest House Canteen
      alias: "canteen-b",
      name: "Guest House Canteen",
      location: "Guest House Complex",
      timing: "8:00 AM - 5:00 PM",
      rating: 4.3,
      status: "Open",
      specialties: ["Chinese", "Continental", "Beverages"],
      waitTime: "8-15 mins",
      distance: "350m",
    },
  ];

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
              <div>
                <h1 className="text-xl font-bold">Select Canteen</h1>
                <p className="text-sm opacity-90">
                  Choose your preferred dining location
                </p>
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Choose Your Canteen
            </h2>
            <p className="text-muted-foreground">
              Select from our campus canteens to view menu and place orders
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {canteens.map((canteen) => (
              <Card
                key={canteen.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {canteen.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {canteen.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            canteen.status === "Open" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {canteen.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {canteen.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="mb-1">{canteen.distance}</div>
                      <div>{canteen.waitTime}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{canteen.timing}</span>
                  </div>

                  <Button
                    className="w-full group-hover:bg-primary/90 transition-colors"
                    onClick={() => handleCanteenSelect(canteen.id)}
                  >
                    View Menu & Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                    <CardDescription>
                      Your last 4 orders - reorder quickly
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/user/orders")}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-gray-600">
                      Loading recent orders...
                    </span>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent orders found</p>
                    <p className="text-sm mt-1">
                      Start by selecting a canteen to place your first order
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order, index) => (
                      <div
                        key={order.id || `order-${index}`}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                #{order.orderId}
                              </span>
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.items
                                .slice(0, 2)
                                .map((item, index) => item.name)
                                .join(", ")}
                              {order.items.length > 2 &&
                                ` +${order.items.length - 2} more`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.orderDate} • ₹{order.total}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const canteenId = order.canteenId || "canteen-a";
                              localStorage.setItem(
                                "selectedCanteen",
                                canteenId.toString(),
                              );
                              navigate(`/user/menu/${canteenId}`);
                            }}
                          >
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Favorites */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Your Favorites
                </CardTitle>
                <CardDescription>
                  Most ordered items - quick add to cart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFavorites ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-gray-600">
                      Loading your favorites...
                    </span>
                  </div>
                ) : favoriteItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No favorites yet</p>
                    <p className="text-sm mt-1">
                      Your most ordered items will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteItems.map((item, index) => (
                      <div
                        key={item.id || `favorite-${index}`}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{item.name}</span>
                              <Badge variant="outline" className="text-xs">
                                Ordered {item.orderCount}x
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              ₹{item.price}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-500 mb-2">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {cartSuccess === item.id ? (
                              <Button
                                size="sm"
                                disabled
                                className="bg-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Added
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                disabled={
                                  addingToCart === item.id || !item.isAvailable
                                }
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {addingToCart === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Access to Full Menu */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Access your account and order management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => navigate("/user/orders")}
                  >
                    <ClipboardList className="w-6 h-6" />
                    <span>View All Orders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => {
                      // Refresh the data
                      fetchRecentOrders();
                      fetchFavoriteItems();
                    }}
                  >
                    <Heart className="w-6 h-6" />
                    <span>Refresh Favorites</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
