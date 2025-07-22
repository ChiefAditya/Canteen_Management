import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Shield, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import LoginCredentials from "@/components/LoginCredentials";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, user, error, clearError } =
    useAuth();
  const [activeTab, setActiveTab] = useState<"admin" | "user">("admin");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    canteenId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === "admin" ? "/admin/dashboard" : "/user/canteens";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLoading) return;

    try {
      setSubmitLoading(true);
      clearError();

      await login({
        username: credentials.username.trim(),
        password: credentials.password.trim(),
        role: activeTab,
        canteenId: activeTab === "admin" ? credentials.canteenId : undefined,
      });

      const redirectPath =
        activeTab === "admin" ? "/admin/dashboard" : "/user/canteens";
      navigate(redirectPath);
    } catch (error) {
      // Error is handled by the auth context
      console.error("Login failed:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=200"
              alt="CSIR CRRI Logo"
              className="h-8 w-auto"
            />
            <span className="text-gray-700 font-medium text-sm">
              crricanteen.gov.in
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <LoginCredentials />
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs text-gray-500">Secure Portal</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === "admin"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("user")}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === "user"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>User</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        username: e.target.value.trim(),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {activeTab === "admin" && (
                  <div>
                    <Label
                      htmlFor="canteen"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Canteen Assignment (Optional)
                    </Label>
                    <select
                      id="canteen"
                      value={credentials.canteenId}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          canteenId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Canteens (if authorized)</option>
                      <option value="canteen-a">Campus Canteen A</option>
                      <option value="canteen-b">Guest House Canteen</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a specific canteen or leave blank for full access
                    </p>
                  </div>
                )}

                <div>
                  <Label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitLoading || isLoading}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 px-4 rounded-md font-medium transition-colors"
                >
                  {(submitLoading || isLoading) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Login
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  For technical support, contact IT helpdesk
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Council of Scientific & Industrial Research
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Central Road Research Institute - Canteen Management Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
