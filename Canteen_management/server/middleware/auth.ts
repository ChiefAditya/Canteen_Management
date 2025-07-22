import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/index.js";

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Middleware to check canteen access permissions
export const requireCanteenAccess = (canteenIdParam = "canteenId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Super admin has access to all canteens
    if (req.user.username === "super_admin") {
      return next();
    }

    // Get canteen ID from request (params, body, or query)
    const requestedCanteenId =
      req.params[canteenIdParam] ||
      req.body[canteenIdParam] ||
      req.query[canteenIdParam];

    // If no canteen ID specified and user is admin, they can only see their assigned canteens
    if (!requestedCanteenId) {
      return next(); // Will be handled by data filtering in the route
    }

    // Check if admin has access to the requested canteen
    const assignedCanteens = req.user.assignedCanteens || [];

    if (
      assignedCanteens.length > 0 &&
      !assignedCanteens.includes(requestedCanteenId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You don't have permission for this canteen",
      });
    }

    next();
  };
};

// Helper function to get allowed canteens for the current user
export const getAllowedCanteens = (user: any): string[] => {
  // Super admin can access all canteens
  if (user.username === "super_admin") {
    return []; // Empty array means no restriction (all canteens)
  }

  // Regular admins can only access their assigned canteens
  return user.assignedCanteens || [];
};

// Helper function to filter data based on user's canteen access
export const addCanteenFilter = (user: any, filter: any = {}) => {
  try {
    const allowedCanteens = getAllowedCanteens(user);

    if (allowedCanteens.length > 0) {
      // Convert all to strings for comparison
      const allowedCanteenStrings = allowedCanteens.map((id) => id.toString());
      filter.canteenId = { $in: allowedCanteenStrings };
    }
  } catch (error) {
    console.error("Critical error in addCanteenFilter:", error);
  }
  return filter;
};

// Middleware to require super admin access
export const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Check if user is super admin (no assigned canteens = super admin)
  const isSuperAdmin =
    !req.user.assignedCanteens || req.user.assignedCanteens.length === 0;

  if (!isSuperAdmin && req.user.username !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
};

// Check if user is super admin
export const isSuperAdmin = (user: any): boolean => {
  return (
    !user.assignedCanteens ||
    user.assignedCanteens.length === 0 ||
    user.username === "super_admin"
  );
};

export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
