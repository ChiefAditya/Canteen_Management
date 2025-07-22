import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, handleAPIError } from "@/lib/api";
import type { User, LoginRequest } from "@shared/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("🔍 AuthContext: Checking existing token:", !!token);

        if (token) {
          console.log("🔍 AuthContext: Token found, getting profile...");

          // Add timeout to prevent hanging - reduced to 2 seconds
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Authentication timeout")), 2000),
          );

          const userData = await Promise.race([
            authAPI.getProfile(),
            timeoutPromise,
          ]);

          console.log("✅ AuthContext: Profile data received:", userData);
          setUser(userData as any);
        } else {
          console.log("ℹ️ AuthContext: No token found in localStorage");
        }
      } catch (error) {
        console.error("❌ AuthContext: Auth check failed:", error);

        // If we have stored user data but profile fetch failed, create a fallback user
        const storedRole = localStorage.getItem("userRole");
        const storedUsername = localStorage.getItem("username");

        if (token && storedRole && storedUsername) {
          console.log("🔄 Creating fallback user from stored data");
          setUser({
            id: "fallback-user-id",
            username: storedUsername,
            role: storedRole as "admin" | "user",
            isActive: true,
            assignedCanteens: storedRole === "admin" ? [] : undefined,
          });
        } else {
          // Token is invalid or timed out, clear it
          localStorage.removeItem("authToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("username");
          setUser(null);
        }
      } finally {
        setIsLoading(false);
        console.log(
          "✅ AuthContext: Auth check complete, loading set to false",
        );
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔐 AuthContext: Attempting login with", credentials);
      const loginResponse = await authAPI.login(credentials);
      console.log("✅ AuthContext: Login response received", loginResponse);

      // Store auth data
      localStorage.setItem("authToken", loginResponse.token);
      localStorage.setItem("userRole", loginResponse.user.role);
      localStorage.setItem("username", loginResponse.user.username);

      setUser(loginResponse.user);
      console.log("✅ AuthContext: User set successfully");
    } catch (error: any) {
      console.error("❌ AuthContext: Login error", error);
      let errorMessage = handleAPIError(error);

      // Enhanced error message for user login failures
      if (error.response?.status === 401 && credentials.role === "user") {
        errorMessage =
          "Invalid credentials. Only registered users can access the system. Contact Super Admin to register your account.";
      } else if (error.response?.status === 401) {
        errorMessage =
          "Invalid username or password. Please check your credentials.";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout API fails, clear local data
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
