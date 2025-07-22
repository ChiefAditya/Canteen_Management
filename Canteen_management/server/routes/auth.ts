// import { Router, Request, Response } from "express";
// import { body, validationResult } from "express-validator";
// import rateLimit from "express-rate-limit";
// import { User } from "../models/index.js";
// import { generateToken, authenticateToken } from "../middleware/auth.js";

// const router = Router();

// // Rate limiting for auth routes - more lenient for development
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: process.env.NODE_ENV === "production" ? 5 : 100, // 5 for production, 100 for development
//   message: {
//     success: false,
//     message:
//       process.env.NODE_ENV === "production"
//         ? "Too many authentication attempts, please try again later."
//         : "Rate limit exceeded. In development, this is set to 100 attempts per 15 minutes. Please wait a moment before trying again.",
//   },
//   skipSuccessfulRequests: true, // Don't count successful logins against the limit
//   skipFailedRequests: false, // Count failed attempts to prevent brute force
//   // Skip rate limiting entirely in development if BYPASS_RATE_LIMIT is set
//   skip: (req) =>
//     process.env.NODE_ENV !== "production" &&
//     process.env.BYPASS_RATE_LIMIT === "true",
// });

// // Login route
// router.post(
//   "/login",
//   authLimiter,
//   [
//     body("username")
//       .trim()
//       .isLength({ min: 3 })
//       .withMessage("Username must be at least 3 characters"),
//     body("password")
//       .isLength({ min: 6 })
//       .withMessage("Password must be at least 6 characters"),
//     body("role")
//       .isIn(["admin", "user"])
//       .withMessage("Role must be either admin or user"),
//   ],
//   async (req: Request, res: Response) => {
//     try {
//       // Check validation errors
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: errors.array(),
//         });
//       }

//       const { username, password, role } = req.body;
//       // Find user
//       // const user = await User.findOne({ username, role, isActive: true });
//       // Find user AND explicitly include the password for comparison
// const user = await User.findOne({ username, role, isActive: true }).select(
//   "+password",
// );
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid credentials",
//         });
//       }

//       // Check password
//       const isPasswordValid = await user.comparePassword(password);
//       if (!isPasswordValid) {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid credentials",
//         });
//       }

//       // Update last login
//       user.lastLogin = new Date();
//       await user.save();

//       // Generate token
//       const token = generateToken(user._id.toString(), user.role);

//       // Return user data without password
//       const userResponse = {
//         id: user._id,
//         username: user.username,
//         employeeId: user.employeeId,
//         role: user.role,
//         fullName: user.fullName,
//         department: user.department,
//         designation: user.designation,
//         email: user.email,
//         phone: user.phone,
//         organizationId: user.organizationId,
//         assignedCanteens: user.assignedCanteens,
//         permissions: user.permissions,
//       };

//       res.json({
//         success: true,
//         message: "Login successful",
//         data: {
//           user: userResponse,
//           token,
//         },
//       });
//     } catch (error) {
//       console.error("Login error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       });
//     }
//   },
// );

// // Register route (for creating new users)
// router.post(
//   "/register",
//   authenticateToken,
//   [
//     body("username")
//       .trim()
//       .isLength({ min: 3 })
//       .withMessage("Username must be at least 3 characters"),
//     body("employeeId").optional().trim(),
//     body("password")
//       .isLength({ min: 6 })
//       .withMessage("Password must be at least 6 characters"),
//     body("role")
//       .isIn(["admin", "user"])
//       .withMessage("Role must be either admin or user"),
//     body("fullName").optional().trim(),
//     body("department").optional().trim(),
//     body("designation").optional().trim(),
//     body("email").optional().isEmail().withMessage("Invalid email format"),
//     body("phone").optional().trim(),
//     body("organizationId").optional().trim(),
//     body("assignedCanteens").optional().isArray(),
//   ],
//   async (req: Request, res: Response) => {
//     try {
//       // Only admins can create new users
//       if (req.user.role !== "admin") {
//         return res.status(403).json({
//           success: false,
//           message: "Only admins can create new users",
//         });
//       }

//       // Check validation errors
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: errors.array(),
//         });
//       }

//       const {
//         username,
//         employeeId,
//         password,
//         role,
//         fullName,
//         department,
//         designation,
//         email,
//         phone,
//         organizationId,
//         assignedCanteens,
//       } = req.body;

//       // Check if user already exists
//       const existingUser = await User.findOne({
//         $or: [{ username }, ...(employeeId ? [{ employeeId }] : [])],
//       });
//       if (existingUser) {
//         return res.status(409).json({
//           success: false,
//           message: "Username or Employee ID already exists",
//         });
//       }

//       // Set default permissions based on role
//       let permissions = [];
//       if (role === "admin") {
//         permissions = [
//           "manage_menu",
//           "view_orders",
//           "manage_qr",
//           "view_analytics",
//         ];
//       } else {
//         permissions = ["place_order", "view_menu", "track_orders"];
//       }

//       // Create new user
//       const newUser = new User({
//         username,
//         employeeId,
//         password,
//         role,
//         fullName,
//         department,
//         designation,
//         email,
//         phone,
//         organizationId,
//         assignedCanteens: assignedCanteens || [],
//         permissions,
//       });

//       await newUser.save();

//       // Return user data without password
//       const userResponse = {
//         id: newUser._id,
//         username: newUser.username,
//         employeeId: newUser.employeeId,
//         role: newUser.role,
//         fullName: newUser.fullName,
//         department: newUser.department,
//         designation: newUser.designation,
//         email: newUser.email,
//         phone: newUser.phone,
//         organizationId: newUser.organizationId,
//         assignedCanteens: newUser.assignedCanteens,
//         permissions: newUser.permissions,
//       };

//       res.status(201).json({
//         success: true,
//         message: "User created successfully",
//         data: { user: userResponse },
//       });
//     } catch (error) {
//       console.error("Registration error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       });
//     }
//   },
// );

// // Get current user profile
// router.get(
//   "/profile",
//   authenticateToken,
//   async (req: Request, res: Response) => {
//     try {
//       const userResponse = {
//         id: req.user._id,
//         username: req.user.username,
//         employeeId: req.user.employeeId,
//         role: req.user.role,
//         fullName: req.user.fullName,
//         department: req.user.department,
//         designation: req.user.designation,
//         email: req.user.email,
//         phone: req.user.phone,
//         organizationId: req.user.organizationId,
//         assignedCanteens: req.user.assignedCanteens,
//         permissions: req.user.permissions,
//       };

//       res.json({
//         success: true,
//         data: { user: userResponse },
//       });
//     } catch (error) {
//       console.error("Profile error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       });
//     }
//   },
// );

// // Logout route (client-side token removal is sufficient, but can be extended for token blacklisting)
// router.post("/logout", authenticateToken, (req: Request, res: Response) => {
//   res.json({
//     success: true,
//     message: "Logged out successfully",
//   });
// });

// export default router;




// Import mongoose for the ObjectId validation
import mongoose from "mongoose";
import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { User } from "../models/index.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import { IUser } from "../models/index.js"; // Assuming IUser is exported from models

const router = Router();

// Extend Express Request type to include the user property from authenticateToken
interface AuthRequest extends Request {
  user?: IUser;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 100,
  message: {
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Too many authentication attempts, please try again later."
        : "Rate limit exceeded. In development, this is set to 100 attempts per 15 minutes. Please wait a moment before trying again.",
  },
  skipSuccessfulRequests: true,
  skip: (req) =>
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_RATE_LIMIT === "true",
});

// Login route
router.post(
  "/login",
  authLimiter,
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["admin", "user"])
      .withMessage("Role must be either admin or user"),
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

      const { username, password, role } = req.body;
      const user = await User.findOne({ username, role, isActive: true }).select(
        "+password",
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false }); // Skip validation on login

      const token = generateToken(user._id.toString(), user.role);

      const userResponse = {
        id: user._id,
        username: user.username,
        employeeId: user.employeeId,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        designation: user.designation,
        email: user.email,
        phone: user.phone,
        organizationId: user.organizationId,
        assignedCanteens: user.assignedCanteens,
        permissions: user.permissions,
      };

      res.json({
        success: true,
        message: "Login successful",
        data: { user: userResponse, token },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Register route (for creating new users)
router.post(
  "/register",
  authenticateToken,
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("employeeId").optional().trim(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["admin", "user"])
      .withMessage("Role must be either admin or user"),
    body("fullName").optional().trim(),
    body("department").optional().trim(),
    body("designation").optional().trim(),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone").optional().trim(),
    body("organizationId").optional().trim(),
    body("assignedCanteens").optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can create new users",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        username,
        employeeId,
        password,
        role,
        fullName,
        department,
        designation,
        email,
        phone,
        organizationId,
        assignedCanteens,
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

      const existingUser = await User.findOne({
        $or: [{ username }, ...(employeeId ? [{ employeeId }] : [])],
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username or Employee ID already exists",
        });
      }

      let permissions = [];
      if (role === "admin") {
        permissions = [
          "manage_menu", "view_orders", "manage_qr", "view_analytics",
        ];
      } else {
        permissions = ["place_order", "view_menu", "track_orders"];
      }

      const newUser = new User({
        username,
        employeeId,
        password,
        role,
        fullName,
        department,
        designation,
        email,
        phone,
        organizationId,
        assignedCanteens: assignedCanteens || [],
        permissions,
      });

      await newUser.save();

      const userResponse = {
        id: newUser._id,
        username: newUser.username,
        employeeId: newUser.employeeId,
        role: newUser.role,
        fullName: newUser.fullName,
        department: newUser.department,
        designation: newUser.designation,
        email: newUser.email,
        phone: newUser.phone,
        organizationId: newUser.organizationId,
        assignedCanteens: newUser.assignedCanteens,
        permissions: newUser.permissions,
      };

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user: userResponse },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get current user profile
router.get("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      employeeId: req.user.employeeId,
      role: req.user.role,
      fullName: req.user.fullName,
      department: req.user.department,
      designation: req.user.designation,
      email: req.user.email,
      phone: req.user.phone,
      organizationId: req.user.organizationId,
      assignedCanteens: req.user.assignedCanteens,
      permissions: req.user.permissions,
    };

    res.json({
      success: true,
      data: { user: userResponse },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Logout route
router.post("/logout", authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
