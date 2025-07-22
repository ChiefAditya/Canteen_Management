import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Package,
} from "lucide-react";
import { menuAPI } from "@/lib/api";
import type { MenuItem } from "@shared/api";
import MenuItemModal from "./MenuItemModal";

interface MenuItemsListProps {
  canteenId: string;
  canteenName: string;
  onRefresh?: () => void; // Optional callback to refresh parent data
}

export default function MenuItemsList({
  canteenId,
  canteenName,
  onRefresh,
}: MenuItemsListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "main", label: "Main Course" },
    { value: "south", label: "South Indian" },
    { value: "snacks", label: "Snacks" },
    { value: "beverages", label: "Beverages" },
    { value: "desserts", label: "Desserts" },
  ];

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await menuAPI.getByCanteen(canteenId);
      setMenuItems(items);
      setFilteredItems(items);
    } catch (error: any) {
      console.error("Failed to fetch menu items:", error);
      setError("Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMenuItems();
  }, [canteenId]);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, searchTerm, selectedCategory]);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await menuAPI.delete(item._id); // Use _id
      await fetchMenuItems(); // Refresh the list
      onRefresh?.(); // Notify parent to refresh its data
    } catch (error: any) {
      console.error("Failed to delete menu item:", error);
      alert("Failed to delete menu item");
    }
  };

  const handleModalSuccess = () => {
    fetchMenuItems(); // Refresh the list after successful operation
    onRefresh?.(); // Notify parent to refresh its data
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((cat) => cat.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading menu items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{canteenName} - Menu Items</h3>
          <p className="text-sm text-gray-600">
            Manage menu items for this canteen
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <Button
          variant="outline"
          onClick={fetchMenuItems}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No menu items found
            </h3>
            <p className="text-gray-600 mb-4">
              {menuItems.length === 0
                ? "Start by adding your first menu item"
                : "Try adjusting your search or filter criteria"}
            </p>
            {menuItems.length === 0 && (
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item._id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={item.isAvailable ? "default" : "secondary"}
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>
                      <Badge
                        variant={item.quantity > 0 ? "default" : "destructive"}
                      >
                        {item.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{item.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </div>
                  </div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        canteenId={canteenId}
        canteenName={canteenName}
        menuItem={editingItem}
      />
    </div>
  );
}
