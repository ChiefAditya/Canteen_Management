import {
  User,
  Canteen,
  MenuItem,
  Order,
  PaymentQR,
  Feedback,
} from "../models/index.js";
import bcrypt from "bcryptjs";

export async function seedDatabase(): Promise<void> {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    const existingCanteens = await Canteen.countDocuments();
    const existingMenuItems = await MenuItem.countDocuments();

    if (existingUsers > 0 && existingCanteens > 0) {
      console.log("📊 Database already has data:");
      console.log(`   👥 Users: ${existingUsers}`);
      console.log(`   🏪 Canteens: ${existingCanteens}`);
      console.log(`   🍽️ Menu Items: ${existingMenuItems}`);
      console.log("✅ Skipping seed - using existing data for live screening");
      return;
    }

    console.log("🧹 Initializing fresh database...");
    console.log("💡 This will create sample data for development and testing");

    // Clear existing data only if we're reseeding
    await Promise.all([
      User.deleteMany({}),
      Canteen.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      PaymentQR.deleteMany({}),
    ]);

    // Create Canteens first
    const canteenA = await Canteen.create({
      name: "Campus Canteen A",
      location: "Main Campus Building",
      timing: "8:00 AM - 5:00 PM",
      specialties: ["North Indian", "South Indian", "Snacks"],
      rating: 4.5,
      distance: "200m",
      waitTime: "5-10 mins",
      isActive: true,
    });

    const canteenB = await Canteen.create({
      name: "Guest House Canteen",
      location: "Guest House Complex",
      timing: "8:00 AM - 5:00 PM",
      specialties: ["Chinese", "Continental", "Beverages"],
      rating: 4.3,
      distance: "350m",
      waitTime: "8-15 mins",
      isActive: true,
    });

    console.log("✅ Created canteens");

    // Create Admin Users
    const adminUsers = [
      {
        username: "super_admin",
        employeeId: "SUPER001",
        password: "super@123",
        role: "admin",
        fullName: "System Administrator",
        department: "IT Administration",
        designation: "Super Administrator",
        email: "super.admin@csircrri.res.in",
        phone: "+91-9876543210",
        assignedCanteens: [], // Empty = access to all canteens
        permissions: [
          "manage_menu",
          "view_orders",
          "manage_qr",
          "view_analytics",
        ],
      },
      {
        username: "canteen_a_admin",
        employeeId: "CAN001",
        password: "canteenadmin@123",
        role: "admin",
        fullName: "Raj Kumar Singh",
        department: "Food Services - Campus A",
        designation: "Campus Canteen A Manager",
        email: "canteena@csircrri.res.in",
        phone: "+91-9876543211",
        assignedCanteens: [canteenA._id], // Use actual ObjectId
        permissions: [
          "manage_menu",
          "view_orders",
          "manage_qr",
          "view_analytics",
        ],
      },
      {
        username: "canteen_b_admin",
        employeeId: "CAN002",
        password: "canteenbadmin@123",
        role: "admin",
        fullName: "Priya Sharma",
        department: "Food Services - Guest House",
        designation: "Guest House Canteen Manager",
        email: "guesthouse@csircrri.res.in",
        phone: "+91-9876543212",
        assignedCanteens: [canteenB._id], // Use actual ObjectId
        permissions: [
          "manage_menu",
          "view_orders",
          "manage_qr",
          "view_analytics",
        ],
      },
    ];

    const createdAdmins = await User.create(adminUsers);
    console.log("✅ Created admin users");

    // Create Limited Demo Users (Only 2 for testing)
    const demoUsers = [
      {
        username: "demo_user1",
        employeeId: "DEMO001",
        password: "demo123",
        role: "user",
        fullName: "Demo User 1",
        department: "General",
        designation: "Employee",
        email: "demo1@example.com",
        phone: "+91-0000000001",
        permissions: ["place_order", "view_menu", "track_orders"],
      },
      {
        username: "demo_user2",
        employeeId: "DEMO002",
        password: "demo123",
        role: "user",
        fullName: "Demo User 2",
        department: "General",
        designation: "Employee",
        email: "demo2@example.com",
        phone: "+91-0000000002",
        permissions: ["place_order", "view_menu", "track_orders"],
      },
    ];

    const createdDemoUsers = await User.create(demoUsers);
    console.log("✅ Created demo users");

    // Create Menu Items for Canteen A
    const canteenAMenuItems = [
      {
        name: "Veg Thali",
        price: 120,
        quantity: 50,
        category: "main",
        description:
          "Complete vegetarian meal with rice, dal, vegetables, roti",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Chicken Curry",
        price: 180,
        quantity: 30,
        category: "main",
        description: "Spicy chicken curry with rice or roti",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Masala Dosa",
        price: 80,
        quantity: 40,
        category: "south",
        description: "Crispy dosa with potato filling and chutneys",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Idli Sambhar",
        price: 60,
        quantity: 45,
        category: "south",
        description: "Steamed idli with sambhar and coconut chutney",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Samosa",
        price: 25,
        quantity: 100,
        category: "snacks",
        description: "Deep fried pastry with spiced potato filling",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Pakora",
        price: 30,
        quantity: 80,
        category: "snacks",
        description: "Mixed vegetable fritters",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Tea",
        price: 15,
        quantity: 200,
        category: "beverages",
        description: "Fresh Indian tea with milk and spices",
        canteenId: canteenA._id,
        isAvailable: true,
      },
      {
        name: "Coffee",
        price: 20,
        quantity: 150,
        category: "beverages",
        description: "Strong black coffee",
        canteenId: canteenA._id,
        isAvailable: true,
      },
    ];

    // Create Menu Items for Guest House
    const canteenBMenuItems = [
      {
        name: "Fried Rice",
        price: 90,
        quantity: 35,
        category: "main",
        description: "Chinese style fried rice with vegetables",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Chow Mein",
        price: 100,
        quantity: 30,
        category: "main",
        description: "Stir-fried noodles with vegetables",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Paneer Butter Masala",
        price: 150,
        quantity: 25,
        category: "main",
        description: "Cottage cheese in rich tomato gravy",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Sandwich",
        price: 50,
        quantity: 60,
        category: "snacks",
        description: "Grilled vegetable sandwich",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Burger",
        price: 80,
        quantity: 40,
        category: "snacks",
        description: "Vegetable burger with fries",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Cold Coffee",
        price: 45,
        quantity: 0, // Out of stock
        category: "beverages",
        description: "Chilled coffee with ice cream",
        canteenId: canteenB._id,
        isAvailable: false,
      },
      {
        name: "Fresh Juice",
        price: 40,
        quantity: 70,
        category: "beverages",
        description: "Seasonal fresh fruit juice",
        canteenId: canteenB._id,
        isAvailable: true,
      },
      {
        name: "Lassi",
        price: 35,
        quantity: 50,
        category: "beverages",
        description: "Sweet yogurt drink",
        canteenId: canteenB._id,
        isAvailable: true,
      },
    ];

    await MenuItem.create([...canteenAMenuItems, ...canteenBMenuItems]);
    console.log("✅ Created menu items");

    // Create Sample Orders
    const sampleOrders = [
      {
        userId: createdDemoUsers[0]._id, // Demo User 1
        canteenId: canteenA._id,
        items: [
          {
            menuItem: (await MenuItem.findOne({
              name: "Veg Thali",
              canteenId: canteenA._id,
            }))!._id,
            quantity: 1,
            price: 120,
          },
          {
            menuItem: (await MenuItem.findOne({
              name: "Tea",
              canteenId: canteenA._id,
            }))!._id,
            quantity: 1,
            price: 15,
          },
        ],
        total: 135,
        orderType: "dine-in",
        paymentType: "individual",
        status: "completed",
        notes: "Extra spicy",
        orderId: `ORD-${Date.now()}-SAMPLE001`,
      },
      {
        userId: createdDemoUsers[1]._id, // Demo User 2
        canteenId: canteenB._id,
        items: [
          {
            menuItem: (await MenuItem.findOne({
              name: "Fried Rice",
              canteenId: canteenB._id,
            }))!._id,
            quantity: 2,
            price: 90,
          },
        ],
        total: 180,
        orderType: "takeaway",
        paymentType: "organization",
        status: "pending",
        organizationBill: true,
        orderId: `ORD-${Date.now()}-SAMPLE002`,
      },
      {
        userId: createdDemoUsers[0]._id, // Demo User 1 (cycling back)
        canteenId: canteenA._id,
        items: [
          {
            menuItem: (await MenuItem.findOne({
              name: "Masala Dosa",
              canteenId: canteenA._id,
            }))!._id,
            quantity: 1,
            price: 80,
          },
          {
            menuItem: (await MenuItem.findOne({
              name: "Coffee",
              canteenId: canteenA._id,
            }))!._id,
            quantity: 1,
            price: 20,
          },
        ],
        total: 100,
        orderType: "dine-in",
        paymentType: "individual",
        status: "approved",
        orderId: `ORD-${Date.now()}-SAMPLE003`,
      },
    ];

    await Order.create(sampleOrders);
    console.log("✅ Created sample orders");

    // Create sample feedback for completed orders
    const completedOrders = await Order.find({ status: "completed" }).limit(10);
    const feedbacks = [];

    for (const order of completedOrders) {
      // Create 1-2 feedback entries per completed order (not all orders have feedback)
      if (Math.random() > 0.3) {
        // 70% chance of having feedback
        feedbacks.push({
          userId: order.userId,
          orderId: order._id,
          canteenId: order.canteenId,
          rating: Math.floor(Math.random() * 2) + 4, // Mostly 4-5 star ratings
          comment: [
            "Great food quality and service!",
            "Quick delivery and hot food",
            "Good variety of menu items",
            "Satisfied with the experience",
            "Amazing taste and presentation",
            "Excellent value for money",
            "Will definitely order again",
            "Fast and friendly service",
          ][Math.floor(Math.random() * 8)],
          recommend: Math.random() > 0.1, // 90% recommendation rate
          isAnonymous: Math.random() > 0.7, // 30% anonymous feedback
        });
      }
    }

    if (feedbacks.length > 0) {
      await Feedback.create(feedbacks);
      console.log(`✅ Created ${feedbacks.length} feedback entries`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log(
      "┌─────────────────────────────────────────────────────────────��",
    );
    console.log(
      "│                        ADMIN ACCOUNTS                      │",
    );
    console.log(
      "├���──────��─────────────────���───────────────────────────────────┤",
    );
    console.log(
      "��� Super Admin:        super_admin / super@123                │",
    );
    console.log(
      "│ Canteen A Admin:    canteen_a_admin / canteenadmin@123     │",
    );
    console.log(
      "│ Guest House Admin:  canteen_b_admin / canteenbadmin@123    │",
    );
    console.log(
      "├──────────────────────────────────────────────────────���──────┤",
    );
    console.log(
      "│                        USER ACCOUNTS                       │",
    );
    console.log(
      "├───────────────────────────────────────────��─────────────────┤",
    );
    console.log(
      "│ User:            user / password123                        │",
    );
    console.log(
      "│ Researcher:      researcher1 / research@123                │",
    );
    console.log(
      "│ Engineer:        engineer1 / engineer@123                  │",
    );
    console.log(
      "│ Student:         student1 / student@123                    │",
    );
    console.log(
      "│ Staff:           staff1 / staff@123                        │",
    );
    console.log(
      "└───────���─────────────────────────────────────────────────────┘",
    );
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}
