import express from "express";
import crypto from "crypto";
import { PaymentQR, Order, User } from "../models/index.js";
import { authenticateToken, requireCanteenAccess } from "../middleware/auth.js";
import { handleAPIError } from "../utils/errors.js";
import {
  getRazorpayInstance,
  getRazorpayCredentials,
  getPublicRazorpayKey,
  hasValidRazorpayConfig,
  getCanteenName,
} from "../config/razorpay.js";

const router = express.Router();

// Get Razorpay configuration for specific canteen
router.get(
  "/razorpay-config/:canteenId",
  authenticateToken,
  async (req, res) => {
    try {
      const { canteenId } = req.params;

      const configCheck = hasValidRazorpayConfig(canteenId);
      if (!configCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: configCheck.message,
        });
      }

      const publicKey = getPublicRazorpayKey(canteenId);
      const canteenName = getCanteenName(canteenId);

      res.json({
        success: true,
        data: {
          key: publicKey,
          canteenId,
          canteenName,
        },
      });
    } catch (error) {
      handleAPIError(res, error, "Failed to get Razorpay configuration");
    }
  },
);

// Transaction Schema for tracking
const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    canteenId: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "qr", "organization"],
      required: true,
    },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

import mongoose from "mongoose";
const Transaction = mongoose.model("Transaction", transactionSchema);

// Create Razorpay order
router.post("/create-order", authenticateToken, async (req, res) => {
  try {
    const { amount, currency = "INR", orderData } = req.body;
    const canteenId = orderData?.canteenId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!canteenId) {
      return res.status(400).json({
        success: false,
        message: "Canteen ID is required",
      });
    }

    // Check if canteen has valid Razorpay configuration
    const configCheck = hasValidRazorpayConfig(canteenId);
    if (!configCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: configCheck.message,
      });
    }

    // Get canteen-specific Razorpay instance
    const razorpay = getRazorpayInstance(canteenId);
    const credentials = getRazorpayCredentials(canteenId);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user.id,
        canteenId: orderData?.canteenId || "",
        orderType: orderData?.orderType || "takeaway",
      },
    });

    // Create transaction record
    const transaction = new Transaction({
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency,
      userId: req.user.id,
      canteenId: orderData?.canteenId || "",
      paymentMethod: "razorpay",
      metadata: orderData || {},
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        transactionId: transaction._id,
        key: credentials.key_id,
        canteenId,
        canteenName: getCanteenName(canteenId),
      },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to create payment order");
  }
});

// Verify Razorpay payment
router.post("/verify-payment", authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
      orderData,
    } = req.body;

    const canteenId = orderData?.canteenId;
    if (!canteenId) {
      return res.status(400).json({
        success: false,
        message: "Canteen ID is required for payment verification",
      });
    }

    // Get canteen-specific credentials for verification
    const credentials = getRazorpayCredentials(canteenId);

    // Verify signature with canteen-specific secret
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", credentials.key_secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = "paid";
    transaction.metadata = {
      ...transaction.metadata,
      canteenRazorpayKeyId: credentials.key_id,
      canteenName: getCanteenName(canteenId),
    };
    await transaction.save();

    // Create the actual order
    const order = new Order({
      userId: req.user.id,
      canteenId: orderData.canteenId,
      items: orderData.items.map((item) => ({
        menuItem: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
      total: orderData.total,
      orderType: orderData.orderType,
      paymentType: "individual",
      status: "completed",
      notes: `Paid via Razorpay - Payment ID: ${razorpay_payment_id}`,
      orderId: transaction.orderId,
    });

    await order.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order._id,
        transactionId: transaction._id,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to verify payment");
  }
});

// Get payment transactions (Admin only)
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      canteenId,
      startDate,
      endDate,
    } = req.query;

    const query: any = {};

    // Add canteen filter for non-super admins
    if (req.user.assignedCanteens && req.user.assignedCanteens.length > 0) {
      query.canteenId = { $in: req.user.assignedCanteens };
    } else if (canteenId) {
      query.canteenId = canteenId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(query)
      .populate("userId", "username fullName employeeId")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments(query);

    // Calculate summary statistics
    const totalAmount = await Transaction.aggregate([
      { $match: { ...query, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAmount = await Transaction.aggregate([
      {
        $match: {
          ...query,
          status: "paid",
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        summary: {
          totalRevenue: totalAmount[0]?.total || 0,
          todayRevenue: todayAmount[0]?.total || 0,
          totalTransactions: total,
        },
      },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch transactions");
  }
});

// Get transaction analytics
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const { canteenId, startDate, endDate } = req.query;

    const matchQuery: any = {};

    // Add canteen filter
    if (req.user.assignedCanteens && req.user.assignedCanteens.length > 0) {
      matchQuery.canteenId = { $in: req.user.assignedCanteens };
    } else if (canteenId) {
      matchQuery.canteenId = canteenId;
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate as string);
    }

    // Get payment method distribution
    const paymentMethods = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    // Get daily revenue for last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const dailyRevenue = await Transaction.aggregate([
      {
        $match: {
          ...matchQuery,
          status: "paid",
          createdAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top canteens by revenue
    const topCanteens = await Transaction.aggregate([
      { $match: { ...matchQuery, status: "paid" } },
      {
        $group: {
          _id: "$canteenId",
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        paymentMethods,
        dailyRevenue,
        topCanteens,
      },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch payment analytics");
  }
});

// QR Code Management (existing routes)
router.get("/canteen/:canteenId", authenticateToken, async (req, res) => {
  try {
    const { canteenId } = req.params;

    const paymentQR = await PaymentQR.findOne({
      canteenId,
      isActive: true,
    }).populate("adminId", "username");

    if (!paymentQR) {
      return res.status(404).json({
        success: false,
        message: "Payment QR not found for this canteen",
      });
    }

    res.json({
      success: true,
      data: { paymentQR },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch payment QR");
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const query = {};

    // Add canteen filter for non-super admins
    if (req.user.assignedCanteens && req.user.assignedCanteens.length > 0) {
      query.canteenId = { $in: req.user.assignedCanteens };
    }

    const paymentQRs = await PaymentQR.find(query)
      .populate("adminId", "username")
      .populate("canteenId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { paymentQRs },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch payment QRs");
  }
});

export default router;
