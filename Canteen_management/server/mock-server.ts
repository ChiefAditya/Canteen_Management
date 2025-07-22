import express from "express";
import cors from "cors";

// Mock data
const mockUsers = [
  { id: "1", username: "admin", password: "admin123", role: "admin" },
  { id: "2", username: "user", password: "password123", role: "user" },
];

const mockCanteens = [
  {
    id: "canteen-a",
    name: "Campus Canteen A",
    location: "Main Campus Building",
    timing: "8:00 AM - 8:00 PM",
    specialties: ["North Indian", "South Indian", "Snacks"],
    rating: 4.5,
    distance: "200m",
    waitTime: "5-10 mins",
    isActive: true,
  },
  {
    id: "canteen-b",
    name: "Guest House Canteen",
    location: "Academic Block 2",
    timing: "7:30 AM - 9:00 PM",
    specialties: ["Chinese", "Continental", "Beverages"],
    rating: 4.3,
    distance: "350m",
    waitTime: "8-15 mins",
    isActive: true,
  },
];

const mockMenuItems = [
  {
    id: "1",
    name: "Veg Thali",
    price: 120,
    quantity: 50,
    category: "main",
    description: "Complete vegetarian meal with rice, dal, vegetables, roti",
    canteenId: "canteen-a",
    isAvailable: true,
  },
  {
    id: "2",
    name: "Chicken Curry",
    price: 180,
    quantity: 30,
    category: "main",
    description: "Spicy chicken curry with rice or roti",
    canteenId: "canteen-a",
    isAvailable: true,
  },
  {
    id: "3",
    name: "Masala Dosaaaaaaaaaaaaaaaa",
    price: 80,
    quantity: 40,
    category: "south",
    description: "Crispy dosa with potato filling and chutneys",
    canteenId: "canteen-a",
    isAvailable: true,
  },
  {
    id: "4",
    name: "Samosaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    price: 25,
    quantity: 100,
    category: "snacks",
    description: "Deep fried pastry with spiced potato filling",
    canteenId: "canteen-a",
    isAvailable: true,
  },
  {
    id: "5",
    name: "Teaaaaaaaaaaaaaaaaaaaaaaaaaa",
    price: 15,
    quantity: 200,
    category: "beverages",
    description: "Fresh Indian tea with milk and spices",
    canteenId: "canteen-a",
    isAvailable: true,
  },
];

export function createMockServer(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Mock Canteen Management API is running",
      version: "1.0.0-mock",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/ping", (req, res) => {
    res.json({
      success: true,
      message: "pong",
      timestamp: new Date().toISOString(),
    });
  });

  // Auth endpoints
  app.post("/api/auth/login", (req, res) => {
    const { username, password, role } = req.body;

    const user = mockUsers.find(
      (u) =>
        u.username === username && u.password === password && u.role === role,
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Mock JWT token
    const token = `mock-jwt-token-${user.id}`;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      },
    });
  });

  app.get("/api/auth/profile", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Mock profile based on token
    const userId = authHeader.includes("1") ? "1" : "2";
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  // Canteen endpoints
  app.get("/api/canteens", (req, res) => {
    res.json({
      success: true,
      data: { canteens: mockCanteens },
    });
  });

  app.get("/api/canteens/:id", (req, res) => {
    const canteen = mockCanteens.find((c) => c.id === req.params.id);
    if (!canteen) {
      return res.status(404).json({
        success: false,
        message: "Canteen not found",
      });
    }

    res.json({
      success: true,
      data: { canteen },
    });
  });

  // Menu endpoints
  app.get("/api/menu/canteen/:canteenId", (req, res) => {
    const { canteenId } = req.params;
    const items = mockMenuItems.filter((item) => item.canteenId === canteenId);

    res.json({
      success: true,
      data: { menuItems: items },
    });
  });

  // Orders endpoint (basic)
  app.post("/api/orders", (req, res) => {
    const order = {
      id: `order-${Date.now()}`,
      ...req.body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  });

  app.get("/api/orders/my-orders", (req, res) => {
    res.json({
      success: true,
      data: {
        orders: [],
        pagination: {
          current: 1,
          total: 1,
          count: 0,
          totalRecords: 0,
        },
      },
    });
  });

  // Catch all for other API routes
  app.use("/api/*", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Mock API endpoint - feature not implemented yet",
      endpoint: req.path,
    });
  });

  return app;
}
