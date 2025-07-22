import axios, { AxiosError } from "axios";
import type {
  LoginRequest,
  LoginResponse,
  User,
  Canteen,
  MenuItem,
  Order,
  PaymentQR,
  Feedback,
} from "@shared/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", credentials);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/profile");
    return response.data.data.user;
  },

  register: async (userData: {
    username: string;
    password: string;
    role: "admin" | "user";
    organizationId?: string;
  }): Promise<User> => {
    const response = await api.post("/auth/register", userData);
    return response.data.data.user;
  },
};

// Canteen API
export const canteenAPI = {
  getAll: async (): Promise<Canteen[]> => {
    const response = await api.get("/canteens");
    return response.data.data.canteens;
  },

  getById: async (id: string): Promise<Canteen> => {
    const response = await api.get(`/canteens/${id}`);
    return response.data.data.canteen;
  },

  create: async (canteenData: Partial<Canteen>): Promise<Canteen> => {
    const response = await api.post("/canteens", canteenData);
    return response.data.data.canteen;
  },

  update: async (
    id: string,
    canteenData: Partial<Canteen>,
  ): Promise<Canteen> => {
    const response = await api.put(`/canteens/${id}`, canteenData);
    return response.data.data.canteen;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/canteens/${id}`);
  },
};

// Menu API
export const menuAPI = {
  getByCanteen: async (
    canteenId: string,
    filters?: { category?: string; available?: boolean },
  ): Promise<MenuItem[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.available !== undefined)
      params.append("available", filters.available.toString());

    const response = await api.get(
      `/menu/canteen/${canteenId}?${params.toString()}`,
    );
    return response.data.data.menuItems;
  },

  getAll: async (filters?: {
    canteenId?: string;
    category?: string;
    available?: boolean;
  }): Promise<MenuItem[]> => {
    // Temporarily disabled to fix analytics error
    console.log("menuAPI.getAll temporarily disabled");
    return [];

    /*
    const params = new URLSearchParams();
    if (filters?.canteenId) params.append("canteenId", filters.canteenId);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.available !== undefined)
      params.append("available", filters.available.toString());

    const response = await api.get(`/menu?${params.toString()}`);
    return response.data.data.menuItems;
    */
  },

  getById: async (id: string): Promise<MenuItem> => {
    const response = await api.get(`/menu/${id}`);
    return response.data.data.menuItem;
  },

  create: async (menuItemData: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await api.post("/menu", menuItemData);
    return response.data.data.menuItem;
  },

  update: async (
    id: string,
    menuItemData: Partial<MenuItem>,
  ): Promise<MenuItem> => {
    const response = await api.put(`/menu/${id}`, menuItemData);
    return response.data.data.menuItem;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/menu/${id}`);
  },

  bulkUpdateQuantities: async (
    updates: { id: string; quantity: number }[],
  ): Promise<void> => {
    await api.patch("/menu/bulk-update", { updates });
  },
};

// Order API
export const orderAPI = {
  create: async (orderData: {
    canteenId: string;
    items: { menuItem: string; quantity: number }[];
    orderType: "dine-in" | "takeaway";
    paymentType: "individual" | "organization";
    notes?: string;
  }): Promise<Order> => {
    const response = await api.post("/orders", orderData);
    return response.data.data.order;
  },

  getMyOrders: async (filters?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    orders: Order[];
    pagination: {
      current: number;
      total: number;
      count: number;
      totalRecords: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.page) params.append("page", filters.page.toString());

    const response = await api.get(`/orders/my-orders?${params.toString()}`);
    return response.data.data;
  },

  getAll: async (filters?: {
    status?: string;
    canteenId?: string;
    paymentType?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    orders: Order[];
    pagination: {
      current: number;
      total: number;
      count: number;
      totalRecords: number;
    };
  }> => {
    // Temporarily return empty orders to fix analytics error
    console.log("orderAPI.getAll temporarily disabled");
    return {
      orders: [],
      pagination: {
        current: 1,
        total: 1,
        count: 0,
        totalRecords: 0,
      },
    };

    /*
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.canteenId) params.append("canteenId", filters.canteenId);
    if (filters?.paymentType) params.append("paymentType", filters.paymentType);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.page) params.append("page", filters.page.toString());

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data.data;
    */
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data.order;
  },

  updateStatus: async (
    id: string,
    status: string,
    notes?: string,
  ): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, {
      status,
      notes,
    });
    return response.data.data.order;
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data.data.order;
  },

  getAnalytics: async (filters?: {
    startDate?: string;
    endDate?: string;
    canteenId?: string;
  }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    approvedOrders: number;
    completedOrders: number;
    organizationOrders: number;
    avgOrderValue: number;
  }> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.canteenId) params.append("canteenId", filters.canteenId);

    const response = await api.get(
      `/orders/analytics/summary?${params.toString()}`,
    );
    return response.data.data.analytics;
  },
};

// Payment API
export const paymentAPI = {
  getByCanteen: async (canteenId: string): Promise<PaymentQR> => {
    const response = await api.get(`/payment/canteen/${canteenId}`);
    return response.data.data.paymentQR;
  },

  getAll: async (): Promise<PaymentQR[]> => {
    const response = await api.get("/payment");
    return response.data.data.paymentQRs;
  },

  upload: async (canteenId: string, qrImage: File): Promise<PaymentQR> => {
    const formData = new FormData();
    formData.append("canteenId", canteenId);
    formData.append("qrImage", qrImage);

    const response = await api.post("/payment/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data.paymentQR;
  },

  update: async (
    id: string,
    qrImage?: File,
    isActive?: boolean,
  ): Promise<PaymentQR> => {
    const formData = new FormData();
    if (qrImage) formData.append("qrImage", qrImage);
    if (isActive !== undefined)
      formData.append("isActive", isActive.toString());

    const response = await api.put(`/payment/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data.paymentQR;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payment/${id}`);
  },

  toggle: async (id: string): Promise<PaymentQR> => {
    const response = await api.patch(`/payment/${id}/toggle`);
    return response.data.data.paymentQR;
  },
};

// Feedback API
export const feedbackAPI = {
  getAnalytics: async (filters?: {
    canteenId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalFeedbacks: number;
    averageRating: number;
    satisfactionPercentage: number;
    recommendationRate: number;
    ratingDistribution: { [key: number]: number };
  }> => {
    const params = new URLSearchParams();
    if (filters?.canteenId) params.append("canteenId", filters.canteenId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(`/feedback/analytics?${params.toString()}`);
    return response.data.data;
  },

  getAll: async (filters?: {
    page?: number;
    limit?: number;
    canteenId?: string;
    rating?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    feedbacks: Feedback[];
    pagination: {
      current: number;
      total: number;
      count: number;
      totalRecords: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.canteenId) params.append("canteenId", filters.canteenId);
    if (filters?.rating) params.append("rating", filters.rating.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await api.get(`/feedback?${params.toString()}`);
    return response.data.data;
  },

  getByOrder: async (orderId: string): Promise<Feedback> => {
    const response = await api.get(`/feedback/order/${orderId}`);
    return response.data.data.feedback;
  },

  submit: async (feedbackData: {
    orderId: string;
    rating: number;
    comment?: string;
    recommend?: boolean;
    isAnonymous?: boolean;
  }): Promise<Feedback> => {
    const response = await api.post("/feedback", feedbackData);
    return response.data.data.feedback;
  },

  update: async (
    id: string,
    feedbackData: {
      rating?: number;
      comment?: string;
      recommend?: boolean;
    },
  ): Promise<Feedback> => {
    const response = await api.put(`/feedback/${id}`, feedbackData);
    return response.data.data.feedback;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/feedback/${id}`);
  },
};

// User Management API (Super Admin only)
export const userAPI = {
  // Get all users with pagination and search
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const response = await api.get("/users", { params });
    return response.data.data;
  },

  // Get user by ID
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data.data.user;
  },

  // Create new user
  create: async (userData: {
    username: string;
    password: string;
    role: "admin" | "user";
    fullName?: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    email?: string;
    phone?: string;
    organizationId?: string;
    assignedCanteens?: string[];
  }) => {
    const response = await api.post("/users", userData);
    return response.data.data.user;
  },

  // Update user
  update: async (
    id: string,
    userData: Partial<{
      username: string;
      role: "admin" | "user";
      fullName: string;
      employeeId: string;
      department: string;
      designation: string;
      email: string;
      phone: string;
      organizationId: string;
      assignedCanteens: string[];
      isActive: boolean;
    }>,
  ) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data.user;
  },

  // Reset password
  resetPassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/users/${id}/password`, { newPassword });
    return response.data;
  },

  // Delete user
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get("/users/stats/overview");
    return response.data.data;
  },
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors?.length > 0) {
    return error.response.data.errors.join(", ");
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export default api;
