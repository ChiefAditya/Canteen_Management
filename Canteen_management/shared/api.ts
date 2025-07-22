/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User types for canteen management
 */
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  employeeId?: string;
  role: UserRole;
  fullName?: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  permissions?: string[];
  assignedCanteens?: string[]; // For admins, specifies which canteens they can manage
  lastLogin?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
  canteenId?: string; // For admin role, specifies which canteen to manage
}

export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Canteen and menu management
 */
export interface Canteen {
  id: string;
  name: string;
  location: string;
  timing: string;
  isActive: boolean;
  specialties?: string[];
  rating?: number;
  distance?: string;
  waitTime?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  image?: string;
  canteenId: string;
  isAvailable: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  canteenId: string;
  items: CartItem[];
  total: number;
  orderType: "dine-in" | "takeaway";
  paymentType: "individual" | "organization";
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  organizationBill?: boolean;
  approvedBy?: string;
  notes?: string;
  orderDate?: string;
  orderTime?: string;
  billGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentQR {
  id: string;
  adminId: string;
  canteenId: string;
  qrCodeUrl: string;
  publicId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feedback {
  id: string;
  userId: string;
  orderId: string;
  canteenId: string;
  rating: number; // 1-5
  comment?: string;
  recommend: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}
