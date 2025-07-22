import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

class DatabaseDev {
  private static instance: DatabaseDev;
  private mongoServer?: MongoMemoryServer;

  private constructor() {}

  static getInstance(): DatabaseDev {
    if (!DatabaseDev.instance) {
      DatabaseDev.instance = new DatabaseDev();
    }
    return DatabaseDev.instance;
  }

  async connect(): Promise<void> {
    try {
      // For development, use in-memory MongoDB server
      if (process.env.NODE_ENV === "development") {
        console.log("🚀 Starting in-memory MongoDB server...");
        this.mongoServer = await MongoMemoryServer.create({
          instance: {
            dbName: "canteen-management-dev",
          },
        });

        const mongoUri = this.mongoServer.getUri();
        console.log(`📦 MongoDB Memory Server URI: ${mongoUri}`);

        await mongoose.connect(mongoUri, {
          dbName: "canteen-management-dev",
        });
      } else {
        // For production, use the provided URI
        const mongoUri =
          process.env.MONGODB_URI;

        await mongoose.connect(mongoUri, {
          dbName: process.env.DATABASE_NAME || "canteen-management",
        });
      }

      console.log("✅ Connected to MongoDB successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      process.on("SIGINT", async () => {
        await this.disconnect();
        console.log("📴 MongoDB connection closed due to app termination");
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.connection.close();
    if (this.mongoServer) {
      await this.mongoServer.stop();
      console.log("🛑 MongoDB Memory Server stopped");
    }
  }
}

export default DatabaseDev;
