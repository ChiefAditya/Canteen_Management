import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { userAPI, handleAPIError, canteenAPI } from "@/lib/api";
import type { User } from "@shared/api";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: "create" | "edit";
}

export default function UserManagementModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode,
}: UserManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [canteens, setCanteens] = useState<{ _id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    fullName: "",
    employeeId: "",
    department: "",
    designation: "",
    email: "",
    phone: "",
    organizationId: "",
    assignedCanteens: [] as string[],
    isActive: true,
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        setFormData({
          username: user.username || "",
          password: "",
          confirmPassword: "",
          role: user.role as "admin" | "user",
          fullName: user.fullName || "",
          employeeId: user.employeeId || "",
          department: user.department || "",
          designation: user.designation || "",
          email: user.email || "",
          phone: user.phone || "",
          organizationId: user.organizationId || "",
          assignedCanteens: user.assignedCanteens || [],
          isActive: user.isActive !== false,
        });
      } else {
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          role: "user",
          fullName: "",
          employeeId: "",
          department: "",
          designation: "",
          email: "",
          phone: "",
          organizationId: "",
          assignedCanteens: [],
          isActive: true,
        });
      }
      setError("");
    }
  }, [isOpen, mode, user]);

  // Fetch canteens on mount
  useEffect(() => {
    canteenAPI.getAll().then((data) => setCanteens(data));
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };

  const handleCanteenToggle = (canteenId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedCanteens: prev.assignedCanteens.includes(canteenId)
        ? prev.assignedCanteens.filter((id) => id !== canteenId)
        : [...prev.assignedCanteens, canteenId],
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }

    if (mode === "create" && !formData.password) {
      setError("Password is required");
      return false;
    }

    if (mode === "create" && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (mode === "create" && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const userData = {
        username: formData.username.trim(),
        ...(mode === "create" && { password: formData.password }),
        role: formData.role,
        fullName: formData.fullName.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        organizationId: formData.organizationId.trim(),
        assignedCanteens:
          formData.role === "admin" ? formData.assignedCanteens : [],
        isActive: formData.isActive,
      };

      if (mode === "create") {
        await userAPI.create(userData as any);
      } else if (user) {
        await userAPI.update(user.id!, userData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} user:`, error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {mode === "create" ? "Add New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new user account for the canteen management system"
              : "Update user information and permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "create" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Enter password"
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) =>
                    handleInputChange("employeeId", e.target.value)
                  }
                  placeholder="Enter employee ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  placeholder="Enter department"
                />
              </div>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    handleInputChange("designation", e.target.value)
                  }
                  placeholder="Enter designation"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="organizationId">Organization ID</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="organizationId"
                  value={formData.organizationId}
                  onChange={(e) =>
                    handleInputChange("organizationId", e.target.value)
                  }
                  placeholder="Enter organization ID"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Admin Settings */}
          {formData.role === "admin" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Admin Settings
              </h3>

              <div>
                <Label>Assigned Canteens</Label>
                <div className="mt-2 space-y-2">
                  {canteens.map((canteen) => (
                    <label
                      key={canteen._id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedCanteens.includes(canteen._id)}
                        onChange={() => handleCanteenToggle(canteen._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {canteen.name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for super admin access to all canteens
                </p>
              </div>
            </div>
          )}

          {/* Status */}
          {mode === "edit" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Status</h3>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active User</span>
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create User" : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
