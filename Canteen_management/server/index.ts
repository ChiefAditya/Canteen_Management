import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import * as Database from "./config/database.js";
import { seedDatabase } from "./utils/seed.js";

// Import routes
import authRoutes from "./routes/auth.js";
import canteenRoutes from "./routes/canteens.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import feedbackRoutes from "./routes/feedback.js";
import userRoutes from "./routes/users.js";
import { handleDemo } from "./routes/demo.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(): express.Express {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["http://localhost:8080", process.env.FRONTEND_URL]
          : true,
      credentials: true,
    }),
  );

  // Compression middleware for better performance
  app.use(
    compression({
      level: 6, // Balanced compression
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Rate limiting - more lenient for development
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000, // Higher limit for development
    message: {
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Too many requests from this IP, please try again later."
          : "Global rate limit exceeded. In development, this is set to 1000 requests per 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Don't count successful requests
    // Skip rate limiting entirely in development if BYPASS_RATE_LIMIT is set
    skip: (req) =>
      process.env.NODE_ENV !== "production" &&
      process.env.BYPASS_RATE_LIMIT === "true",
  });
  app.use("/api/", limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check routes
  app.get("/api/ping", (req, res) => {
    res.json({
      success: true,
      message: "pong",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Canteen Management API is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/db-status", async (req, res) => {
    try {
      const mongoose = await import("mongoose");
      const isConnected = mongoose.connection.readyState === 1;
      const dbName = mongoose.connection.db?.databaseName;

      res.json({
        success: true,
        connected: isConnected,
        database: dbName,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        states: {
          0: "disconnected",
          1: "connected",
          2: "connecting",
          3: "disconnecting",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        connected: false,
      });
    }
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/canteens", canteenRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/users", userRoutes);

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err);

      // Multer errors
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 5MB.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Unexpected file field.",
        });
      }

      // MongoDB errors
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(err.errors).map((e: any) => e.message),
        });
      }

      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Duplicate entry found",
        });
      }

      // Default error
      res.status(500).json({
        success: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
      });
    },
  );

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  });

  return app;
}

// Initialize database and start server
export async function startServer() {
  try {
    // Connect to database
    const db = Database.getInstance();
    await db.connect();

    // Seed database with initial data
    if (process.env.NODE_ENV !== "production") {
      await seedDatabase();
    }

    console.log("🚀 Backend server initialized successfully");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}
