import mongoose from "mongoose";

class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
          const mongoUri =
        process.env.MONGODB_URI;
    try {


      console.log(`🔗 Attempting to connect to: ${mongoUri}`);

      await mongoose.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "Canteen_management",
        serverSelectionTimeoutMS: 5000, // Reduced timeout
        connectTimeoutMS: 5000,
        maxPoolSize: 10,
      });

      console.log("✅ Connected to MongoDB successfully");
      console.log(
        `📂 Using database: ${process.env.DATABASE_NAME || "Canteen_management"}`,
      );

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("📴 MongoDB connection closed due to app termination");
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      console.error("💡 Make sure MongoDB is running on localhost:27017");
      console.error("💡 You can start MongoDB with: mongod --dbpath ./data/db");
      console.error(
        "💡 Or install MongoDB from: https://www.mongodb.com/try/download/community",
      );

      // For development, we could fall back to an alternative
      throw new Error(
        `MongoDB connection failed. Please ensure MongoDB is running at: ${mongoUri}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.connection.close();
  }
}

export default Database;
