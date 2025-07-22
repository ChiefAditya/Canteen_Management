import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer = null;
let usingMemoryServer = false;

async function connect() {
  // ⚠️ SINGLE CONFIGURATION POINT - ONLY EDIT THE .env FILE
  // Your MongoDB connection string goes in the .env file as MONGODB_URI
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes("<") || mongoUri.includes("your-")) {
    console.log("⚠️ No valid MongoDB URI found in .env file");
    console.log(
      "💡 Add your connection string to .env as MONGODB_URI=your-connection-string",
    );
    await startMemoryServer();
    return;
  }

  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    console.log(
      `📡 URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`,
    );

    // Simplified, working connection options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB Atlas successfully!");
    console.log("📂 Database: canteen_management");
    usingMemoryServer = false;
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("   Error:", error.message);

    if (error.message.includes("authentication failed")) {
      console.error("   🔐 Check username/password in connection string");
    } else if (error.message.includes("getaddrinfo ENOTFOUND")) {
      console.error("   🌐 Check network connectivity");
    } else if (error.message.includes("IP address")) {
      console.error("   🛡️ Add your IP to MongoDB Atlas Network Access");
    }

    console.log("⚠️ Falling back to in-memory database...");
    await startMemoryServer();
  }

  setupEventHandlers();
}

async function startMemoryServer() {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: "canteen_management_dev" },
    });

    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    console.log("��� Connected to in-memory MongoDB");
    console.log("💡 Data will not persist between restarts");
    usingMemoryServer = true;
  } catch (error) {
    console.error("❌ Failed to start in-memory database:", error);
    throw error;
  }
}

function setupEventHandlers() {
  mongoose.connection.on("error", (error) => {
    console.error("❌ MongoDB error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });

  process.on("SIGINT", async () => {
    await disconnect();
    process.exit(0);
  });
}

async function disconnect() {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

function isUsingMemoryServer() {
  return usingMemoryServer;
}

export { connect, disconnect, isUsingMemoryServer };
