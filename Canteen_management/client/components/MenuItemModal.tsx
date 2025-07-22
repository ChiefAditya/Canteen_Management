import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { menuAPI } from "@/lib/api";
import type { MenuItem } from "@shared/api";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  canteenId: string;
  canteenName: string;
  menuItem?: MenuItem | null; // For editing existing items
}

export default function MenuItemModal({
  isOpen,
  onClose,
  onSuccess,
  canteenId,
  canteenName,
  menuItem,
}: MenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
    description: "",
    image: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!menuItem;

  // Categories available
  const categories = [
    { value: "main", label: "Main Course" },
    { value: "south", label: "South Indian" },
    { value: "snacks", label: "Snacks" },
    { value: "beverages", label: "Beverages" },
    { value: "desserts", label: "Desserts" },
  ];

  // Reset form when modal opens/closes or menuItem changes
  useEffect(() => {
    if (isOpen) {
      if (menuItem) {
        // Editing existing item
        setFormData({
          name: menuItem.name || "",
          price: menuItem.price?.toString() || "",
          quantity: menuItem.quantity?.toString() || "",
          category: menuItem.category || "",
          description: menuItem.description || "",
          image: menuItem.image || "",
        });
      } else {
        // Adding new item
        setFormData({
          name: "",
          price: "",
          quantity: "",
          category: "",
          description: "",
          image: "",
        });
      }
      setError(null);
    }
  }, [isOpen, menuItem]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  // Debounced validation to reduce unnecessary API calls
  const debouncedValidation = useDebouncedCallback((data: typeof formData) => {
    // Perform any real-time validation here if needed
    // For example, checking if item name already exists
  }, 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validation
    if (
      !formData.name ||
      !formData.price ||
      !formData.quantity ||
      !formData.category
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    const quantity = parseInt(formData.quantity);

    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      setError("Please enter a valid quantity");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const menuItemData = {
        name: formData.name.trim(),
        price: price,
        quantity: quantity,
        category:
          formData.category === "Main Course"
            ? "main"
            : formData.category.toLowerCase(),
        description: formData.description.trim(),
        image: formData.image.trim() || undefined,
        canteenId: canteenId,
        isAvailable: quantity > 0,
      };

      if (isEditing && menuItem) {
        // Update existing item
        await menuAPI.update(menuItem._id, menuItemData);
      } else {
        // Create new item
        await menuAPI.create(menuItemData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Menu item operation failed:", error);
      setError(
        error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} menu item`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update menu item for ${canteenName}`
              : `Add a new menu item to ${canteenName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Veg Thali"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="e.g., 120"
                required
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="e.g., 50"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the item..."
              rows={3}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Image URL (Optional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
