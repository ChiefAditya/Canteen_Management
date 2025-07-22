import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Feedback, Order, Canteen } from "../models/index.js";
import { authenticateToken, addCanteenFilter } from "../middleware/auth.js";

const router = Router();

// Get feedback analytics (average rating, count, etc.)
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const { canteenId, startDate, endDate } = req.query;

    // Build match filter
    let matchFilter: any = {};
    if (canteenId) matchFilter.canteenId = canteenId;
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    // Apply canteen access control for admin users
    if (req.user && req.user.role === "admin") {
      matchFilter = addCanteenFilter(req.user, matchFilter);
    }

    // Aggregate feedback statistics
    const analytics = await Feedback.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratingDistribution: {
            $push: "$rating",
          },
          totalRecommendations: {
            $sum: { $cond: ["$recommend", 1, 0] },
          },
        },
      },
    ]);

    const result = analytics[0] || {
      totalFeedbacks: 0,
      averageRating: 0,
      ratingDistribution: [],
      totalRecommendations: 0,
    };

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach((rating: number) => {
      distribution[rating as keyof typeof distribution]++;
    });

    // Calculate satisfaction percentage (4+ stars)
    const positiveRatings = result.ratingDistribution.filter(
      (r: number) => r >= 4,
    ).length;
    const satisfactionPercentage =
      result.totalFeedbacks > 0
        ? Math.round((positiveRatings / result.totalFeedbacks) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        totalFeedbacks: result.totalFeedbacks,
        averageRating: Number(result.averageRating.toFixed(2)),
        satisfactionPercentage,
        recommendationRate:
          result.totalFeedbacks > 0
            ? Math.round(
                (result.totalRecommendations / result.totalFeedbacks) * 100,
              )
            : 0,
        ratingDistribution: distribution,
      },
    });
  } catch (error) {
    console.error("Get feedback analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback analytics",
    });
  }
});

// Get all feedback (with pagination)
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      canteenId,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = {};
    if (canteenId) filter.canteenId = canteenId;
    if (rating) filter.rating = parseInt(rating as string);

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const feedbacks = await Feedback.find(filter)
      .populate("userId", "username fullName")
      .populate("orderId", "orderId")
      .populate("canteenId", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: feedbacks.length,
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});

// Get feedback for specific order
router.get("/order/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const feedback = await Feedback.findOne({ orderId })
      .populate("userId", "username fullName")
      .populate("canteenId", "name");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "No feedback found for this order",
      });
    }

    res.json({
      success: true,
      data: { feedback },
    });
  } catch (error) {
    console.error("Get order feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order feedback",
    });
  }
});

// Submit feedback (authenticated users only)
router.post(
  "/",
  authenticateToken,
  [
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment must be less than 500 characters"),
    body("recommend")
      .optional()
      .isBoolean()
      .withMessage("Recommend must be boolean"),
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("isAnonymous must be boolean"),
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

      const { orderId, rating, comment, recommend, isAnonymous } = req.body;
      const userId = req.user._id;

      // Verify order exists and belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        status: "completed", // Only allow feedback for completed orders
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found or not eligible for feedback",
        });
      }

      // Check if feedback already exists for this order
      const existingFeedback = await Feedback.findOne({ orderId });
      if (existingFeedback) {
        return res.status(400).json({
          success: false,
          message: "Feedback already submitted for this order",
        });
      }

      // Create feedback
      const feedback = new Feedback({
        userId,
        orderId,
        canteenId: order.canteenId,
        rating,
        comment: comment?.trim(),
        recommend: recommend !== undefined ? recommend : true,
        isAnonymous: isAnonymous || false,
      });

      await feedback.save();

      // Populate the response
      const populatedFeedback = await Feedback.findById(feedback._id)
        .populate("userId", "username fullName")
        .populate("canteenId", "name");

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        data: { feedback: populatedFeedback },
      });
    } catch (error) {
      console.error("Submit feedback error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit feedback",
      });
    }
  },
);

// Update feedback (only by the user who created it)
router.put(
  "/:id",
  authenticateToken,
  [
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment must be less than 500 characters"),
    body("recommend")
      .optional()
      .isBoolean()
      .withMessage("Recommend must be boolean"),
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

      const { id } = req.params;
      const userId = req.user._id;
      const updateData = req.body;

      // Find feedback and verify ownership
      const feedback = await Feedback.findOne({ _id: id, userId });
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found or unauthorized",
        });
      }

      // Update feedback
      const updatedFeedback = await Feedback.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("userId", "username fullName")
        .populate("canteenId", "name");

      res.json({
        success: true,
        message: "Feedback updated successfully",
        data: { feedback: updatedFeedback },
      });
    } catch (error) {
      console.error("Update feedback error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update feedback",
      });
    }
  },
);

// Delete feedback (only by the user who created it)
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // Find and delete feedback
      const feedback = await Feedback.findOneAndDelete({ _id: id, userId });
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found or unauthorized",
        });
      }

      res.json({
        success: true,
        message: "Feedback deleted successfully",
      });
    } catch (error) {
      console.error("Delete feedback error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete feedback",
      });
    }
  },
);

export default router;
