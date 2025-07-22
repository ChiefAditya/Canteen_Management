import mongoose from "mongoose";
import { MenuItem } from "./server/models/index.js";
import "dotenv/config";

const checkDataTypes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in .env file.");
    }

    console.log("Connecting to database...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    const count = await MenuItem.countDocuments({
      canteenId: { $type: "string" },
    });

    if (count > 0) {
      console.log("\n=============================================");
      console.log(`🔴 PROBLEM FOUND: ${count} menu items have the wrong data type for canteenId.`);
      console.log("=============================================");
    } else {
      console.log("\n=============================================");
      console.log("✅ No data type issues found.");
      console.log("=============================================");
    }

    await mongoose.disconnect();
    console.log("Disconnected.");

  } catch (error) {
    console.error("An error occurred:", (error as Error).message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

checkDataTypes();