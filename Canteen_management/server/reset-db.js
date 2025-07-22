import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
  try {
    const mongoUri =
      process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      dbName: process.env.DATABASE_NAME || "Canteen_management",
    });

    console.log("🗑️ Clearing existing database...");
    await mongoose.connection.db.dropDatabase();
    console.log("✅ Database cleared successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

resetDatabase();
