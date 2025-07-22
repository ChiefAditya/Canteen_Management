import { createServer } from "./index.js";
import HybridDatabase from "./config/database.hybrid.js";
import { seedDatabase } from "./utils/seed.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = createServer();
const PORT = process.env.PORT || 8080;

async function startDevServer() {
  try {
    console.log("🔧 Starting Canteen Management Backend Server...");
    console.log("🔍 Environment Variables Debug:");
    console.log(
      `DATABASE_URI: ${process.env.DATABASE_URI ? "SET" : "NOT SET"}`,
    );
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? "SET" : "NOT SET"}`);
    console.log(
      `📡 Preferred MongoDB: ${process.env.DATABASE_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/Canteen_management"}`,
    );

    // Connect to database (with fallback)
    const db = HybridDatabase.getInstance();
    await db.connect();

    // Seed database with initial data
    await seedDatabase();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend proxy: Configure Vite to proxy to port ${PORT}`);
      console.log(`💾 Database: ${db.getConnectionInfo()}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startDevServer();
