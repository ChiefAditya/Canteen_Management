import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { MenuItem, Canteen } from "../models/index.js";
import {
  authenticateToken,
  requireRole,
  requireCanteenAccess,
  addCanteenFilter,
} from "../middleware/auth.js";
import CacheManager from "../utils/cache.js"; // Import the CacheManager instance

const router = Router();

// Get menu items for a specific canteen (USER FACING ROUTE)
router.get(
  "/canteen/:canteenId",
  authenticateToken, // Require authentication
  async (req: Request, res: Response) => {
    try {
      const { canteenId } = req.params;
      const user = (req as any).user;
      // Standardize query params with a default of "all"
      const categoryQuery = (req.query.category as string) || "all";
      const availableQuery = (req.query.available as string) || "all";

      // --- REFACTORED CACHE LOGIC ---
      // Check cache using the consistent CacheManager helper
      const cachedMenuItems = CacheManager.getMenuItems(canteenId, categoryQuery, availableQuery);

      if (cachedMenuItems) {
        return res.json({
          success: true,
          data: { menuItems: cachedMenuItems },
          cached: true,
        });
      }

      // Build filter
      let filter: any = {};
      if (mongoose.Types.ObjectId.isValid(canteenId)) {
        filter.canteenId = new mongoose.Types.ObjectId(canteenId);
      } else {
        // Handle legacy string IDs by looking up canteen by name
        const legacyMapping: { [key: string]: string } = {
          "canteen-a": "Campus Canteen A",
          "canteen-b": "Guest House Canteen",
        };
        const canteenName = legacyMapping[canteenId];
        if (canteenName) {
          const canteen = await Canteen.findOne({ name: canteenName });
          if (canteen) {
            filter.canteenId = canteen._id;
          } else {
            return res.json({ success: true, data: { menuItems: [] } });
          }
        } else {
          return res.json({ success: true, data: { menuItems: [] } });
        }
      }

      // Role-based access control
      if (user.role === "admin") {
        // Only allow if canteenId is in assignedCanteens
        if (!user.assignedCanteens || !user.assignedCanteens.includes(canteenId)) {
          return res.status(403).json({ success: false, message: "Access denied: not assigned to this canteen." });
        }
      }
      // For super_admin, allow all
      // For normal user, optionally restrict further if needed (not implemented here)

      // Apply filters from query params
      if (categoryQuery !== "all") filter.category = categoryQuery;
      if (availableQuery !== "all") filter.isAvailable = availableQuery === "true";

      // For admins, use addCanteenFilter to ensure only allowed canteens
      if (user.role === "admin") {
        filter = addCanteenFilter(user, filter);
      }

      console.log("Menu filter:", JSON.stringify(filter, null, 2));

      const menuItems = await MenuItem.find(filter)
        .populate("canteenId", "name location")
        .sort({ category: 1, name: 1 })
        .lean();

      console.log("Found menu items:", menuItems.length);

      // Cache the result using the consistent CacheManager helper
      CacheManager.setMenuItems(canteenId, categoryQuery, availableQuery, menuItems);

      res.json({
        success: true,
        data: { menuItems },
      });
    } catch (error) {
      console.error("Get menu items error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch menu items",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  }
);


// --- ALL OTHER ROUTES BELOW ARE UNCHANGED ---

// Get all menu items (Admin only - filtered by canteen access)
router.get(
  "/",
  authenticateToken,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const {
        canteenId,
        category,
        available,
        page = 1,
        limit = 50,
      } = req.query;

      let filter: any = {};
      if (canteenId) {
        if (mongoose.Types.ObjectId.isValid(canteenId as string)) {
          filter.canteenId = new mongoose.Types.ObjectId(canteenId as string);
        } else {
          const legacyMapping: { [key: string]: string } = {
            "canteen-a": "Campus Canteen A",
            "canteen-b": "Guest House Canteen",
          };
          const canteenName = legacyMapping[canteenId as string];
          if (canteenName) {
            const canteen = await Canteen.findOne({ name: canteenName });
            if (canteen) {
              filter.canteenId = canteen._id;
            }
          }
        }
      }
      if (category) filter.category = category;
      if (available !== undefined) filter.isAvailable = available === "true";

      filter = addCanteenFilter(req.user, filter);

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [menuItems, total] = await Promise.all([
        MenuItem.find(filter)
          .populate("canteenId", "name location")
          .sort({ canteenId: 1, category: 1, name: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        MenuItem.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          menuItems,
          pagination: {
            current: pageNum,
            total: Math.ceil(total / limitNum),
            count: menuItems.length,
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      console.error("Get all menu items error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch menu items",
      });
    }
  },
);

// Get single menu item
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(
      "canteenId",
      "name location",
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
    });
  }
});

// Create new menu item (Admin only)
router.post(
  "/",
  authenticateToken,
  requireRole("admin"),
  requireCanteenAccess("canteenId"),
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("category")
      .isIn(["main", "south", "snacks", "beverages", "desserts"])
      .withMessage("Invalid category"),
    body("canteenId").isMongoId().withMessage("Valid canteen ID is required"),
    body("description").optional().trim(),
    body("image")
      .optional()
      .trim()
      .isURL()
      .withMessage("Image must be a valid URL"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const canteen = await Canteen.findById(req.body.canteenId);
      if (!canteen) {
        return res.status(404).json({
          success: false,
          message: "Canteen not found",
        });
      }

      const menuItemData = {
        ...req.body,
        isAvailable: req.body.quantity > 0,
      };

      const newMenuItem = new MenuItem(menuItemData);
      await newMenuItem.save();

      const populatedMenuItem = await MenuItem.findById(
        newMenuItem._id,
      ).populate("canteenId", "name location");

      // Invalidate cache for this canteen
      CacheManager.invalidateMenuCache(req.body.canteenId);

      res.status(201).json({
        success: true,
        message: "Menu item created successfully",
        data: { menuItem: populatedMenuItem },
      });
    } catch (error) {
      console.error("Create menu item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create menu item",
      });
    }
  },
);

// Update menu item (Admin only - with canteen access check)
router.put(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Name cannot be empty"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("category")
      .optional()
      .isIn(["main", "south", "snacks", "beverages", "desserts"])
      .withMessage("Invalid category"),
    body("description").optional().trim(),
    body("image").optional().trim(),
    body("isAvailable")
      .optional()
      .isBoolean()
      .withMessage("isAvailable must be boolean"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const existingItem = await MenuItem.findById(req.params.id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      const allowedCanteens = req.user.assignedCanteens || [];
      const isSuperAdmin =
        req.user.username === "super_admin" ||
        !req.user.assignedCanteens ||
        req.user.assignedCanteens.length === 0;
      if (
        !isSuperAdmin &&
        allowedCanteens.length > 0 &&
        !allowedCanteens.includes(existingItem.canteenId.toString())
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied: You can only modify items from your assigned canteens",
        });
      }

      const updateData = { ...req.body };

      if (updateData.quantity !== undefined) {
        updateData.isAvailable = updateData.quantity > 0;
      }
      
      // Invalidate cache on update
      CacheManager.invalidateMenuCache(existingItem.canteenId.toString());

      const updatedMenuItem = await MenuItem.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      ).populate("canteenId", "name location");

      res.json({
        success: true,
        message: "Menu item updated successfully",
        data: { menuItem: updatedMenuItem },
      });
    } catch (error) {
      console.error("Update menu item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update menu item",
      });
    }
  },
);

// Delete menu item (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const menuItem = await MenuItem.findById(req.params.id);

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      // Super admin can delete any item; normal admins only their canteens
      const allowedCanteens = req.user.assignedCanteens || [];
      const isSuperAdmin =
        req.user.username === "super_admin" ||
        !req.user.assignedCanteens ||
        req.user.assignedCanteens.length === 0;
      if (
        !isSuperAdmin &&
        allowedCanteens.length > 0 &&
        !allowedCanteens.includes(menuItem.canteenId.toString())
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied: You can only delete items from your assigned canteens",
        });
      }

      // Invalidate cache on delete
      CacheManager.invalidateMenuCache(menuItem.canteenId.toString());

      await MenuItem.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error("Delete menu item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete menu item",
      });
    }
  },
);

// Bulk update quantities (Admin only)
router.patch(
  "/bulk-update",
  authenticateToken,
  requireRole("admin"),
  [
    body("updates")
      .isArray({ min: 1 })
      .withMessage("Updates array is required"),
    body("updates.*.id")
      .isMongoId()
      .withMessage("Valid menu item ID is required"),
    body("updates.*.quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { updates } = req.body;
      const bulkOps = updates.map((update: any) => ({
        updateOne: {
          filter: { _id: update.id },
          update: {
            quantity: update.quantity,
            isAvailable: update.quantity > 0,
          },
        },
      }));

      // Invalidate cache for all affected canteens
      const itemIds = updates.map((u: any) => u.id);
      const itemsToUpdate = await MenuItem.find({ _id: { $in: itemIds } }).select('canteenId');
      const uniqueCanteenIds = [...new Set(itemsToUpdate.map(item => item.canteenId.toString()))];
      uniqueCanteenIds.forEach(id => CacheManager.invalidateMenuCache(id));

      const result = await MenuItem.bulkWrite(bulkOps);

      res.json({
        success: true,
        message: "Menu items updated successfully",
        data: {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        },
      });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update menu items",
      });
    }
  },
);

export default router;