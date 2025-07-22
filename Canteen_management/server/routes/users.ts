import express from "express";
// Import mongoose to use its ObjectId validator
import mongoose from "mongoose"; 
import { User } from "../models/index.js";
import { authenticateToken, requireSuperAdmin } from "../middleware/auth.js";
import { handleAPIError } from "../utils/errors.js";

const router = express.Router();

// Get all users (Super Admin only)
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch users");
  }
});

// Get user by ID (Super Admin only)
router.get("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to fetch user");
  }
});

// Create new user (Super Admin only)
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      fullName,
      employeeId,
      department,
      designation,
      email,
      phone,
      organizationId,
      assignedCanteens,
    } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and role are required",
      });
    }
    
    // --- ADDED VALIDATION ---
    // Validate assignedCanteens before proceeding
    if (assignedCanteens && Array.isArray(assignedCanteens)) {
      for (const id of assignedCanteens) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ObjectId format in assignedCanteens: ${id}`,
          });
        }
      }
    }
    // --- END ADDED VALIDATION ---

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists",
        });
      }
    }

    // Create user
    const user = new User({
      username,
      password,
      role,
      fullName,
      employeeId,
      department,
      designation,
      email,
      phone,
      organizationId,
      assignedCanteens: role === "admin" ? assignedCanteens : [],
      permissions:
        role === "admin"
          ? ["manage_menu", "view_orders", "manage_qr", "view_analytics"]
          : ["place_order", "view_menu", "track_orders"],
    });

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select("-password");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to create user");
  }
});

// Update user (Super Admin only)
router.put("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      username,
      role,
      fullName,
      employeeId,
      department,
      designation,
      email,
      phone,
      organizationId,
      assignedCanteens,
      isActive,
    } = req.body;
    
    // --- ADDED VALIDATION ---
    // Validate assignedCanteens before proceeding
    if (assignedCanteens && Array.isArray(assignedCanteens)) {
      for (const id of assignedCanteens) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ObjectId format in assignedCanteens: ${id}`,
          });
        }
      }
    }
    // --- END ADDED VALIDATION ---

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if username is being changed and if new username exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    // Check if employeeId is being changed and if new employeeId exists
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists",
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        role,
        fullName,
        employeeId,
        department,
        designation,
        email,
        phone,
        organizationId,
        assignedCanteens: role === "admin" ? assignedCanteens : [],
        isActive,
        permissions:
          role === "admin"
            ? ["manage_menu", "view_orders", "manage_qr", "view_analytics"]
            : ["place_order", "view_menu", "track_orders"],
      },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    handleAPIError(res, error, "Failed to update user");
  }
});

// Reset user password (Super Admin only)
router.put(
  "/:id/password",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      handleAPIError(res, error, "Failed to update password");
    }
  },
);

// Delete user (Super Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Prevent deletion of super admin
      if (user.username === "super_admin") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete super admin account",
        });
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      handleAPIError(res, error, "Failed to delete user");
    }
  },
);

// Get user statistics (Super Admin only)
router.get(
  "/stats/overview",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const adminUsers = await User.countDocuments({ role: "admin" });
      const regularUsers = await User.countDocuments({ role: "user" });

      // Users created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          adminUsers,
          regularUsers,
          recentUsers,
          inactiveUsers: totalUsers - activeUsers,
        },
      });
    } catch (error) {
      handleAPIError(res, error, "Failed to fetch user statistics");
    }
  },
);

export default router;