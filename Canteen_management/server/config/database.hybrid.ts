import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

class HybridDatabase {
  private static instance: HybridDatabase;
  private mongoServer?: MongoMemoryServer;
  private usingMemoryServer: boolean = false;

  private constructor() {}

  static getInstance(): HybridDatabase {
    if (!HybridDatabase.instance) {
      HybridDatabase.instance = new HybridDatabase();
    }
    return HybridDatabase.instance;
  }

  async connect(): Promise<void> {
    const preferredUri =
      process.env.DATABASE_URI ||
      process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME || "Canteen_management";

    // Check if the URI has placeholder values
    if (
      preferredUri.includes("<db_password>") ||
      preferredUri.includes("<username>")
    ) {
      console.warn(
        "⚠️ Database URI contains placeholder values, falling back to in-memory server...",
      );
      console.log("💡 Please update .env file with actual MongoDB credentials");
      await this.startInMemoryServer();
      return;
    }

    try {
      // First, try to connect to the specified MongoDB
      console.log(
        `🔗 Attempting to connect to: ${preferredUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`,
      );

      // Check if it's an Atlas connection (contains mongodb+srv)
      const isAtlasConnection = preferredUri.includes("mongodb+srv://");

      const connectionOptions: any = {
        dbName: dbName,
        maxPoolSize: 20, // Increased for 150+ users
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 15000, // Increased timeout
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: "majority",
      };

      // Use different timeouts for Atlas vs local connections
      if (isAtlasConnection) {
        connectionOptions.serverSelectionTimeoutMS = 15000; // Increased timeout
        connectionOptions.connectTimeoutMS = 15000;
        console.log("��� Detected MongoDB Atlas connection");
        console.log("🔍 Connection details:", {
          cluster: preferredUri.includes("cluster0.dodnrnc.mongodb.net"),
          hasRetryWrites: preferredUri.includes("retryWrites=true"),
          hasAppName: preferredUri.includes("appName=Cluster0"),
        });
      } else {
        connectionOptions.serverSelectionTimeoutMS = 3000; // Quick timeout for local
        connectionOptions.connectTimeoutMS = 3000;
        console.log("🏠 Detected local MongoDB connection");
      }

      console.log("⏳ Attempting MongoDB connection...");
      await mongoose.connect(preferredUri, connectionOptions);

      console.log("✅ Connected to MongoDB Atlas successfully!");
      console.log(`📂 Using database: ${dbName}`);
      this.usingMemoryServer = false;
    } catch (error) {
      console.error("❌ MongoDB Atlas connection failed:");
      if (error instanceof Error) {
        console.error("   Error name:", error.name);
        console.error("   Error message:", error.message);

        // Specific error type checking
        if (error.message.includes("authentication failed")) {
          console.error("   🔐 Authentication issue - check username/password");
        } else if (error.message.includes("network")) {
          console.error(
            "   🌐 Network issue - check IP whitelist in MongoDB Atlas",
          );
        } else if (error.message.includes("timeout")) {
          console.error(
            "   ⏰ Connection timeout - check network connectivity",
          );
        }
      }

      console.warn("⚠️ Falling back to in-memory server for development...");
      await this.startInMemoryServer();
    }

    this.setupConnectionHandlers();
  }

  private async startInMemoryServer(): Promise<void> {
    try {
      console.log("🚀 Starting in-memory MongoDB server as fallback...");

      // Fallback to in-memory MongoDB
      this.mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: "Canteen_management_dev",
        },
      });

      const fallbackUri = this.mongoServer.getUri();
      console.log(`📦 MongoDB Memory Server URI: ${fallbackUri}`);

      await mongoose.connect(fallbackUri, {
        dbName: "Canteen_management_dev",
      });

      console.log("✅ Connected to fallback in-memory MongoDB");
      console.log(
        "💡 Data will not persist between restarts (using memory server)",
      );
      this.usingMemoryServer = true;
    } catch (fallbackError) {
      console.error("❌ Failed to start fallback database:", fallbackError);
      throw new Error("Both primary and fallback database connections failed");
    }
  }

  private setupConnectionHandlers(): void {
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
  }

  async disconnect(): Promise<void> {
    await mongoose.connection.close();
    if (this.mongoServer) {
      await this.mongoServer.stop();
      console.log("🛑 MongoDB Memory Server stopped");
    }
  }

  isUsingMemoryServer(): boolean {
    return this.usingMemoryServer;
  }

  getConnectionInfo(): string {
    if (this.usingMemoryServer) {
      return "In-Memory MongoDB (development fallback)";
    } else {
      return `MongoDB at ${process.env.MONGODB_URI || "mongodb://localhost:27017/Canteen_management"}`;
    }
  }
}

export default HybridDatabase;
