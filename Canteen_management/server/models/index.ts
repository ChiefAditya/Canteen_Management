import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// 1. DEFINE THE INTERFACE FOR THE USER DOCUMENT
// This tells TypeScript about the shape of a User document, including custom methods.
export interface IUser extends Document {
  username: string;
  employeeId?: string;
  password?: string; // Optional because it might not be selected in all queries
  role: "admin" | "user";
  fullName?: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  assignedCanteens: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User Schema
// 2. APPLY THE INTERFACE TO THE SCHEMA DEFINITION
const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Good practice to not send the hash by default
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: String,
      trim: true,
    },
    assignedCanteens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Canteen",
        required: true,
      },
    ],
    permissions: [
      {
        type: String,
        enum: [
          "manage_menu",
          "view_orders",
          "manage_qr",
          "view_analytics",
          "place_order",
          "view_menu",
          "track_orders",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
// 3. APPLY THE INTERFACE TO THE PRE-SAVE HOOK FOR TYPE SAFETY
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  // `this.password` is available here because the method is called on an instance
  // that explicitly queried for the password, or during auth where we need it.
  return bcrypt.compare(candidatePassword, this.password);
};

// Canteen Schema
const canteenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    timing: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    distance: {
      type: String,
      default: "0m",
    },
    waitTime: {
      type: String,
      default: "5-10 mins",
    },
  },
  {
    timestamps: true,
  },
);

// MenuItem Schema
const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["main", "south", "snacks", "beverages", "desserts"],
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["individual", "organization"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    organizationBill: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderTime: {
      type: String,
      default: function () {
        return new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    billGeneratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-generate order ID
orderSchema.pre("save", function (next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Payment QR Schema
const paymentQRSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    qrCodeUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Feedback Schema
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    recommend: {
      type: Boolean,
      default: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance

// User indexes
// userSchema.index({ username: 1 });      // REMOVE this line
// userSchema.index({ employeeId: 1 });    // REMOVE this line
userSchema.index({ role: 1 });
userSchema.index({ assignedCanteens: 1 });
userSchema.index({ isActive: 1 });

// Canteen indexes
canteenSchema.index({ isActive: 1 });
canteenSchema.index({ name: 1 });

// MenuItem indexes
menuItemSchema.index({ canteenId: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ canteenId: 1, category: 1 });
menuItemSchema.index({ canteenId: 1, isAvailable: 1 });
menuItemSchema.index({ name: "text", description: "text" }); // Text search

// Order indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ canteenId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ canteenId: 1, orderDate: -1 });
// orderSchema.index({ orderId: 1 });      // REMOVE this line

// PaymentQR indexes
paymentQRSchema.index({ canteenId: 1 });
paymentQRSchema.index({ adminId: 1 });
paymentQRSchema.index({ isActive: 1 });

// Feedback indexes
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ canteenId: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ userId: 1 });

// Create models
// 4. APPLY THE INTERFACE WHEN EXPORTING THE MODEL
export const User = mongoose.model<IUser>("User", userSchema);
export const Canteen = mongoose.model("Canteen", canteenSchema);
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export const Order = mongoose.model("Order", orderSchema);
export const PaymentQR = mongoose.model("PaymentQR", paymentQRSchema);
export const Feedback = mongoose.model("Feedback", feedbackSchema);
