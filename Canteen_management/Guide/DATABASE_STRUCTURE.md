# 🗄️ MongoDB Database Structure - Canteen Management System

This document outlines the complete database structure required for the Canteen Management System.

## 📊 Database Overview

**Database Name**: `canteen_management`  
**Collections**: 7 main collections  
**Relationships**: Referenced relationships using ObjectIds

---

## 📋 Collections Structure

### 1. 👥 Users Collection

**Collection Name**: `users`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  username: String,                 // Unique username (required)
  employeeId: String,               // Unique employee ID (optional)
  password: String,                 // Hashed password (required)
  role: String,                     // "admin" | "user" (required)
  fullName: String,                 // Full display name (optional)
  department: String,               // Department name (optional)
  designation: String,              // Job designation (optional)
  email: String,                    // Email address (optional)
  phone: String,                    // Phone number (optional)
  organizationId: String,           // Organization identifier (optional)
  assignedCanteens: [String],       // Array of canteen IDs for admins
  permissions: [String],            // Array of permission strings
  isActive: Boolean,                // Account status (default: true)
  lastLogin: Date,                  // Last login timestamp
  createdAt: Date,                  // Account creation date
  updatedAt: Date                   // Last update date
}
```

**Indexes:**

```javascript
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
```

**Sample Data:**

```javascript
// Super Admin
{
  username: "super_admin",
  password: "$2a$12$hashedPassword",
  role: "admin",
  fullName: "Super Administrator",
  assignedCanteens: [],              // Empty array = access to all canteens
  permissions: ["manage_all"],
  isActive: true
}

// Canteen Admin
{
  username: "canteen_a_admin",
  password: "$2a$12$hashedPassword",
  role: "admin",
  fullName: "Campus Canteen Manager",
  assignedCanteens: ["canteen-a"],   // Limited to specific canteen
  permissions: ["manage_menu", "view_orders", "manage_qr", "view_analytics"],
  isActive: true
}

// Regular User
{
  username: "demo_user1",
  employeeId: "EMP001",
  password: "$2a$12$hashedPassword",
  role: "user",
  fullName: "John Doe",
  department: "Research",
  designation: "Research Fellow",
  email: "john.doe@institute.gov.in",
  phone: "+91-9876543210",
  permissions: ["place_order", "view_menu", "track_orders"],
  isActive: true
}
```

---

### 2. 🏢 Canteens Collection

**Collection Name**: `canteens`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  id: String,                       // Custom ID (e.g., "canteen-a")
  name: String,                     // Canteen display name (required)
  location: String,                 // Physical location (required)
  timing: String,                   // Operating hours (required)
  isActive: Boolean,                // Operational status (default: true)
  specialties: [String],            // Array of specialty cuisines
  rating: Number,                   // Average rating (0-5)
  distance: String,                 // Distance from main location
  waitTime: String,                 // Estimated wait time
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.canteens.createIndex({ id: 1 }, { unique: true });
db.canteens.createIndex({ name: 1 });
db.canteens.createIndex({ isActive: 1 });
```

**Sample Data:**

```javascript
{
  id: "canteen-a",
  name: "Campus Canteen A",
  location: "Main Campus Building",
  timing: "8:00 AM - 5:00 PM",
  isActive: true,
  specialties: ["North Indian", "South Indian", "Snacks"],
  rating: 4.5,
  distance: "200m",
  waitTime: "5-10 mins"
}

{
  id: "canteen-b",
  name: "Guest House Canteen",
  location: "Guest House Complex",
  timing: "8:00 AM - 5:00 PM",
  isActive: true,
  specialties: ["Chinese", "Continental", "Beverages"],
  rating: 4.3,
  distance: "350m",
  waitTime: "8-15 mins"
}
```

---

### 3. 🍽️ MenuItems Collection

**Collection Name**: `menuitems`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  name: String,                     // Item name (required)
  price: Number,                    // Price in INR (required)
  quantity: Number,                 // Available quantity (required)
  category: String,                 // "main", "south", "snacks", "beverages", "desserts"
  description: String,              // Item description (optional)
  image: String,                    // Image URL (optional)
  canteenId: String,                // Reference to canteen ID (required)
  isAvailable: Boolean,             // Availability status (default: true)
  ingredients: [String],            // Array of ingredients (optional)
  allergens: [String],              // Array of allergens (optional)
  nutritionalInfo: {                // Nutritional information (optional)
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.menuitems.createIndex({ canteenId: 1 });
db.menuitems.createIndex({ category: 1 });
db.menuitems.createIndex({ isAvailable: 1 });
db.menuitems.createIndex({ name: "text", description: "text" });
```

**Sample Data:**

```javascript
{
  name: "Veg Thali",
  price: 120,
  quantity: 50,
  category: "main",
  description: "Complete vegetarian meal with rice, dal, vegetables, roti",
  canteenId: "canteen-a",
  isAvailable: true,
  ingredients: ["Rice", "Dal", "Mixed Vegetables", "Roti", "Pickle"],
  allergens: ["Gluten"],
  nutritionalInfo: {
    calories: 650,
    protein: 18,
    carbs: 85,
    fat: 12
  }
}

{
  name: "Masala Dosa",
  price: 80,
  quantity: 40,
  category: "south",
  description: "Crispy dosa with potato filling and chutneys",
  canteenId: "canteen-a",
  isAvailable: true,
  ingredients: ["Rice", "Urad Dal", "Potato", "Onions", "Spices"],
  allergens: [],
  nutritionalInfo: {
    calories: 420,
    protein: 8,
    carbs: 55,
    fat: 18
  }
}
```

---

### 4. 📋 Orders Collection

**Collection Name**: `orders`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  orderId: String,                  // Unique order identifier (auto-generated)
  userId: ObjectId,                 // Reference to user._id (required)
  canteenId: String,                // Reference to canteen ID (required)
  items: [{                         // Array of ordered items
    menuItem: ObjectId,             // Reference to menuitem._id
    name: String,                   // Item name (for historical record)
    quantity: Number,               // Quantity ordered
    price: Number,                  // Price at time of order
    subtotal: Number                // quantity * price
  }],
  total: Number,                    // Total order amount (required)
  orderType: String,                // "dine-in" | "takeaway" (required)
  paymentType: String,              // "individual" | "organization" (required)
  paymentMethod: String,            // "razorpay" | "qr" | "organization"
  status: String,                   // "pending", "approved", "rejected", "completed", "cancelled"
  organizationBill: Boolean,        // Whether it's an organization bill
  approvedBy: ObjectId,             // Reference to admin user._id (optional)
  notes: String,                    // Additional notes (optional)
  orderDate: Date,                  // Order date
  orderTime: String,                // Order time (formatted)
  billGeneratedAt: Date,            // Bill generation timestamp
  estimatedReadyTime: Date,         // Estimated completion time (optional)
  actualReadyTime: Date,            // Actual completion time (optional)
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ canteenId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ paymentType: 1 });
db.orders.createIndex({ orderDate: -1 });
db.orders.createIndex({ createdAt: -1 });
```

**Sample Data:**

```javascript
{
  orderId: "ORD-1703123456789-abc123",
  userId: ObjectId("..."),
  canteenId: "canteen-a",
  items: [
    {
      menuItem: ObjectId("..."),
      name: "Veg Thali",
      quantity: 1,
      price: 120,
      subtotal: 120
    },
    {
      menuItem: ObjectId("..."),
      name: "Masala Chai",
      quantity: 2,
      price: 15,
      subtotal: 30
    }
  ],
  total: 150,
  orderType: "takeaway",
  paymentType: "individual",
  paymentMethod: "razorpay",
  status: "completed",
  organizationBill: false,
  notes: "Extra spicy",
  orderDate: new Date(),
  orderTime: "02:30 PM"
}
```

---

### 5. 🏦 Transactions Collection

**Collection Name**: `transactions`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  orderId: String,                  // Reference to order.orderId (required)
  razorpayOrderId: String,          // Razorpay order ID (required)
  razorpayPaymentId: String,        // Razorpay payment ID (after payment)
  razorpaySignature: String,        // Razorpay signature (after payment)
  amount: Number,                   // Transaction amount (required)
  currency: String,                 // Currency code (default: "INR")
  status: String,                   // "created", "paid", "failed"
  userId: ObjectId,                 // Reference to user._id (required)
  canteenId: String,                // Reference to canteen ID (required)
  paymentMethod: String,            // "razorpay", "qr", "organization"
  razorpayKeyId: String,            // Which Razorpay key was used
  gateway: String,                  // Payment gateway used
  gatewayResponse: Object,          // Gateway response data
  metadata: {                       // Additional transaction data
    canteenName: String,
    canteenRazorpayKeyId: String,
    orderItems: Array,
    customerDetails: Object
  },
  createdAt: Date,                  // Transaction creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.transactions.createIndex({ orderId: 1 });
db.transactions.createIndex({ razorpayOrderId: 1 }, { unique: true });
db.transactions.createIndex({ razorpayPaymentId: 1 }, { sparse: true });
db.transactions.createIndex({ userId: 1 });
db.transactions.createIndex({ canteenId: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ createdAt: -1 });
```

**Sample Data:**

```javascript
{
  orderId: "ORD-1703123456789-abc123",
  razorpayOrderId: "order_MkfVmYEd6zp8Hl",
  razorpayPaymentId: "pay_MkfWmYEd6zp8Hm",
  razorpaySignature: "signature_hash_here",
  amount: 150,
  currency: "INR",
  status: "paid",
  userId: ObjectId("..."),
  canteenId: "canteen-a",
  paymentMethod: "razorpay",
  razorpayKeyId: "rzp_test_canteen_a_key",
  gateway: "razorpay",
  metadata: {
    canteenName: "Campus Canteen A",
    canteenRazorpayKeyId: "rzp_test_canteen_a_key",
    orderItems: [...],
    customerDetails: { ... }
  }
}
```

---

### 6. 💬 Feedback Collection

**Collection Name**: `feedback`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  userId: ObjectId,                 // Reference to user._id (required)
  orderId: ObjectId,                // Reference to order._id (required)
  canteenId: String,                // Reference to canteen ID (required)
  rating: Number,                   // Rating 1-5 (required)
  comment: String,                  // User comment (optional, max 500 chars)
  recommend: Boolean,               // Would recommend (default: true)
  isAnonymous: Boolean,             // Anonymous feedback (default: false)
  categories: {                     // Category-wise ratings (optional)
    foodQuality: Number,            // 1-5 rating
    service: Number,                // 1-5 rating
    cleanliness: Number,            // 1-5 rating
    value: Number                   // 1-5 rating
  },
  tags: [String],                   // Feedback tags (optional)
  adminResponse: {                  // Admin response to feedback (optional)
    message: String,
    respondedBy: ObjectId,          // Reference to admin user._id
    respondedAt: Date
  },
  createdAt: Date,                  // Feedback creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.feedback.createIndex({ orderId: 1 });
db.feedback.createIndex({ userId: 1 });
db.feedback.createIndex({ canteenId: 1 });
db.feedback.createIndex({ rating: 1 });
db.feedback.createIndex({ createdAt: -1 });
```

**Sample Data:**

```javascript
{
  userId: ObjectId("..."),
  orderId: ObjectId("..."),
  canteenId: "canteen-a",
  rating: 5,
  comment: "Excellent food quality and quick service!",
  recommend: true,
  isAnonymous: false,
  categories: {
    foodQuality: 5,
    service: 5,
    cleanliness: 4,
    value: 5
  },
  tags: ["quick", "tasty", "fresh"],
  adminResponse: {
    message: "Thank you for your positive feedback!",
    respondedBy: ObjectId("..."),
    respondedAt: new Date()
  }
}
```

---

### 7. 🔗 PaymentQR Collection

**Collection Name**: `paymentqrs`

```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  adminId: ObjectId,                // Reference to admin user._id (required)
  canteenId: String,                // Reference to canteen ID (required)
  qrCodeUrl: String,                // QR code image URL (required)
  publicId: String,                 // Cloudinary public ID (required)
  upiId: String,                    // UPI ID for payments (optional)
  accountDetails: {                 // Bank account details (optional)
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  isActive: Boolean,                // QR code status (default: true)
  uploadedAt: Date,                 // Upload timestamp
  expiresAt: Date,                  // Expiration date (optional)
  usageCount: Number,               // How many times used (default: 0)
  lastUsedAt: Date,                 // Last usage timestamp
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

```javascript
db.paymentqrs.createIndex({ canteenId: 1 });
db.paymentqrs.createIndex({ adminId: 1 });
db.paymentqrs.createIndex({ isActive: 1 });
db.paymentqrs.createIndex({ publicId: 1 }, { unique: true });
```

**Sample Data:**

```javascript
{
  adminId: ObjectId("..."),
  canteenId: "canteen-a",
  qrCodeUrl: "https://res.cloudinary.com/your-cloud/image/upload/v1703123456/qr-canteen-a.png",
  publicId: "qr-canteen-a",
  upiId: "canteena@paytm",
  accountDetails: {
    accountName: "Campus Canteen A",
    accountNumber: "1234567890",
    ifscCode: "BANK0001234",
    bankName: "State Bank of India"
  },
  isActive: true,
  uploadedAt: new Date(),
  usageCount: 25,
  lastUsedAt: new Date()
}
```

---

## 🔗 Relationships

### User → Orders

- One user can have many orders
- `orders.userId` references `users._id`

### User → Feedback

- One user can give feedback for multiple orders
- `feedback.userId` references `users._id`

### Canteen → MenuItems

- One canteen has many menu items
- `menuitems.canteenId` references `canteens.id` (string)

### Canteen → Orders

- One canteen receives many orders
- `orders.canteenId` references `canteens.id` (string)

### Order → OrderItems → MenuItems

- One order contains multiple items
- `orders.items.menuItem` references `menuitems._id`

### Order → Feedback

- One order can have one feedback
- `feedback.orderId` references `orders._id`

### Order → Transactions

- One order can have one transaction
- `transactions.orderId` references `orders.orderId` (string)

---

## 📊 Database Constraints

### Unique Constraints

- `users.username` - Must be unique
- `users.employeeId` - Must be unique (when present)
- `canteens.id` - Must be unique
- `orders.orderId` - Must be unique
- `transactions.razorpayOrderId` - Must be unique
- `paymentqrs.publicId` - Must be unique

### Required Fields

- All `_id` fields (auto-generated)
- `users`: username, password, role
- `canteens`: name, location, timing
- `menuitems`: name, price, quantity, category, canteenId
- `orders`: userId, canteenId, items, total, orderType, paymentType
- `transactions`: orderId, razorpayOrderId, amount, userId, canteenId
- `feedback`: userId, orderId, canteenId, rating
- `paymentqrs`: adminId, canteenId, qrCodeUrl, publicId

### Default Values

- `users.isActive`: true
- `canteens.isActive`: true
- `canteens.rating`: 0
- `menuitems.isAvailable`: true
- `orders.status`: "pending"
- `orders.organizationBill`: false
- `transactions.currency`: "INR"
- `transactions.status`: "created"
- `feedback.recommend`: true
- `feedback.isAnonymous`: false
- `paymentqrs.isActive`: true
- `paymentqrs.usageCount`: 0

---

## 🚀 MongoDB Commands to Create Database

```javascript
// Connect to MongoDB
use canteen_management

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "password", "role"],
      properties: {
        username: { bsonType: "string", minLength: 3, maxLength: 50 },
        password: { bsonType: "string", minLength: 6 },
        role: { enum: ["admin", "user"] },
        isActive: { bsonType: "bool" }
      }
    }
  }
})

db.createCollection("canteens", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "location", "timing"],
      properties: {
        name: { bsonType: "string", minLength: 1 },
        location: { bsonType: "string", minLength: 1 },
        timing: { bsonType: "string", minLength: 1 },
        rating: { bsonType: "number", minimum: 0, maximum: 5 }
      }
    }
  }
})

// Create all indexes
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "employeeId": 1 }, { unique: true, sparse: true })
db.canteens.createIndex({ "id": 1 }, { unique: true })
db.menuitems.createIndex({ "canteenId": 1 })
db.orders.createIndex({ "orderId": 1 }, { unique: true })
db.transactions.createIndex({ "razorpayOrderId": 1 }, { unique: true })
db.feedback.createIndex({ "orderId": 1 })
db.paymentqrs.createIndex({ "canteenId": 1 })
```

---

_This database structure supports the complete canteen management system with real-time data, payment processing, user management, and analytics._
