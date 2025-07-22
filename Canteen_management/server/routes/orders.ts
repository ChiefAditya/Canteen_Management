import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { Order, MenuItem, Canteen } from "../models/index.js";
import {
  authenticateToken,
  requireRole,
  requireCanteenAccess,
  addCanteenFilter,
} from "../middleware/auth.js";

const router = Router();

// Create new order
router.post(
  "/",
  authenticateToken,
  [
    body("canteenId").isMongoId().withMessage("Valid canteen ID is required"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one item is required"),
    body("items.*.menuItem")
      .isMongoId()
      .withMessage("Valid menu item ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("orderType")
      .isIn(["dine-in", "takeaway"])
      .withMessage("Order type must be dine-in or takeaway"),
    body("paymentType")
      .isIn(["individual", "organization"])
      .withMessage("Payment type must be individual or organization"),
    body("notes").optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { canteenId, items, orderType, paymentType, notes } = req.body;
      const userId = req.user._id;

      // Verify canteen exists
      const canteen = await Canteen.findById(canteenId);
      if (!canteen || !canteen.isActive) {
        return res.status(404).json({
          success: false,
          message: "Canteen not found or inactive",
        });
      }

      // Verify all menu items exist and calculate total
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem || !menuItem.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Menu item ${item.menuItem} not found or unavailable`,
          });
        }

        if (menuItem.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient quantity for ${menuItem.name}. Available: ${menuItem.quantity}, Requested: ${item.quantity}`,
          });
        }

        const itemTotal = menuItem.price * item.quantity;
        total += itemTotal;

        orderItems.push({
          menuItem: item.menuItem,
          quantity: item.quantity,
          price: menuItem.price,
        });
      }

      // Get current Indian time
      const currentDate = new Date();
      const indianTime = new Date(
        currentDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      const timeString = indianTime.toLocaleTimeString("en-IN", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });

      // Create order with automatic timestamps
      const newOrder = new Order({
        userId,
        canteenId,
        items: orderItems,
        total,
        orderType,
        paymentType,
        organizationBill: paymentType === "organization",
        notes,
        status: paymentType === "organization" ? "pending" : "approved",
        orderDate: indianTime,
        orderTime: timeString,
        billGeneratedAt: indianTime,
      });

      // Ensure orderId is set (backend always generates it)
      if (!newOrder.orderId) {
        newOrder.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      await newOrder.save();

      // Update menu item quantities
      for (const item of items) {
        await MenuItem.findByIdAndUpdate(item.menuItem, {
          $inc: { quantity: -item.quantity },
          $set: { isAvailable: true }, // Will be updated based on remaining quantity
        });

        // Check if item should be marked unavailable
        const updatedMenuItem = await MenuItem.findById(item.menuItem);
        if (updatedMenuItem && updatedMenuItem.quantity <= 0) {
          await MenuItem.findByIdAndUpdate(item.menuItem, {
            isAvailable: false,
          });
        }
      }

      // Populate order details
      const populatedOrder = await Order.findById(newOrder._id)
        .populate("userId", "username role")
        .populate("canteenId", "name location")
        .populate("items.menuItem", "name price category");

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order: populatedOrder },
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order",
      });
    }
  },
);

// Get user's orders
router.get(
  "/my-orders",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { status, limit = 20, page = 1 } = req.query;
      const userId = req.user._id;

      // Build filter
      const filter: any = { userId };
      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const orders = await Order.find(filter)
        .populate("canteenId", "name location")
        .populate("items.menuItem", "name price category")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            count: orders.length,
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  },
);

// Get all orders (Admin only)
router.get(
  "/",
  authenticateToken,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        canteenId,
        paymentType,
        limit = 50,
        page = 1,
      } = req.query;

      // Build filter
      let filter: any = {};
      if (status) filter.status = status;
      if (canteenId) filter.canteenId = canteenId;
      if (paymentType) filter.paymentType = paymentType;

      // Apply canteen access control - admins can only see their assigned canteens
      filter = addCanteenFilter(req.user, filter);

      const skip = (Number(page) - 1) * Number(limit);

      const orders = await Order.find(filter)
        .populate("userId", "username role organizationId")
        .populate("canteenId", "name location")
        .populate("items.menuItem", "name price category")
        .populate("approvedBy", "username")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            count: orders.length,
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      console.error("Get all orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  },
);

// Get single order
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "username role organizationId")
      .populate("canteenId", "name location")
      .populate("items.menuItem", "name price category description")
      .populate("approvedBy", "username");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check permissions - users can only see their own orders, admins can see all
    if (
      req.user.role !== "admin" &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
});

// Update order status (Admin only)
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("admin"),
  [
    body("status")
      .isIn(["pending", "approved", "rejected", "completed", "cancelled"])
      .withMessage("Invalid status"),
    body("notes").optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { status, notes } = req.body;
      const adminId = req.user._id;

      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      // If approving organization bill, set approver
      if (status === "approved") {
        updateData.approvedBy = adminId;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      )
        .populate("userId", "username role organizationId")
        .populate("canteenId", "name location")
        .populate("items.menuItem", "name price category")
        .populate("approvedBy", "username");

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: { order: updatedOrder },
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  },
);

// Cancel order (User can cancel their own pending orders)
router.patch(
  "/:id/cancel",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check permissions
      if (
        req.user.role !== "admin" &&
        order.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Can only cancel pending orders
      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only cancel pending orders",
        });
      }

      // Restore menu item quantities
      for (const item of order.items) {
        await MenuItem.findByIdAndUpdate(item.menuItem, {
          $inc: { quantity: item.quantity },
          $set: { isAvailable: true },
        });
      }

      order.status = "cancelled";
      await order.save();

      const populatedOrder = await Order.findById(order._id)
        .populate("userId", "username role")
        .populate("canteenId", "name location")
        .populate("items.menuItem", "name price category");

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { order: populatedOrder },
      });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel order",
      });
    }
  },
);

// Get order analytics (Admin only)
router.get(
  "/analytics/summary",
  authenticateToken,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, canteenId } = req.query;

      // Build date filter with validation
      const dateFilter: any = {};
      if (startDate) {
        const startDateObj = new Date(startDate as string);
        if (isNaN(startDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date format",
          });
        }
        dateFilter.$gte = startDateObj;
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date format",
          });
        }
        dateFilter.$lte = endDateObj;
      }

      // Build match filter
      let matchFilter: any = {};
      if (Object.keys(dateFilter).length > 0)
        matchFilter.createdAt = dateFilter;

      // Convert canteenId to ObjectId if provided
      if (canteenId) {
        if (!mongoose.Types.ObjectId.isValid(canteenId as string)) {
          return res.status(400).json({
            success: false,
            message: "Invalid canteen ID format",
          });
        }
        matchFilter.canteenId = new mongoose.Types.ObjectId(
          canteenId as string,
        );
      }

      // Apply canteen access control
      matchFilter = addCanteenFilter(req.user, matchFilter);

      // Aggregate analytics
      const analytics = await Order.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approvedOrders: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            organizationOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentType", "organization"] }, 1, 0],
              },
            },
            avgOrderValue: { $avg: "$total" },
          },
        },
      ]);

      const result = analytics[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        completedOrders: 0,
        organizationOrders: 0,
        avgOrderValue: 0,
      };

      res.json({
        success: true,
        data: { analytics: result },
      });
    } catch (error) {
      console.error("Get analytics error:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      });
    }
  },
);

export default router;
