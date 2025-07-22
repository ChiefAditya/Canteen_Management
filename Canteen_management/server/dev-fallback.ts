import express from "express";

// Simple fallback server for development when full backend is not available
export function createFallbackServer(): express.Express {
  const app = express();

  app.use(express.json());

  // Mock health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Development fallback server",
      timestamp: new Date().toISOString(),
    });
  });

  // Mock ping
  app.get("/api/ping", (req, res) => {
    res.json({
      success: true,
      message: "pong",
      timestamp: new Date().toISOString(),
    });
  });

  // Catch all API routes
  app.use("/api/*", (req, res) => {
    res.status(503).json({
      success: false,
      message:
        "Backend service unavailable. Please check server configuration.",
      hint: "Make sure MongoDB connection is configured in .env file",
    });
  });

  return app;
}
