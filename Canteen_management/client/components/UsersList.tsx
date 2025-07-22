import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
  Users,
  Shield,
  MoreVertical,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { userAPI, handleAPIError } from "@/lib/api";
import UserManagementModal from "@/components/UserManagementModal";
import type { User } from "@shared/api";

interface UsersListProps {
  onBack: () => void;
}

export default function UsersList({ onBack }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    user?: User | null;
  }>({
    isOpen: false,
    mode: "create",
    user: null,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user?: User | null;
  }>({
    isOpen: false,
    user: null,
  });

  // Password reset
  const [passwordReset, setPasswordReset] = useState<{
    isOpen: boolean;
    user?: User | null;
    newPassword: string;
    loading: boolean;
  }>({
    isOpen: false,
    user: null,
    newPassword: "",
    loading: false,
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter === "all" ? "" : roleFilter,
      };

      const response = await userAPI.getAll(params);
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
      setTotalUsers(response.pagination.total);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch users on mount and filter changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateUser = () => {
    setUserModal({
      isOpen: true,
      mode: "create",
      user: null,
    });
  };

  const handleEditUser = (user: User) => {
    setUserModal({
      isOpen: true,
      mode: "edit",
      user,
    });
  };

  const handleDeleteUser = (user: User) => {
    setDeleteConfirm({
      isOpen: true,
      user,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.user) return;

    try {
      await userAPI.delete(deleteConfirm.user.id!);
      setDeleteConfirm({ isOpen: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError(handleAPIError(error));
    }
  };

  const handlePasswordReset = (user: User) => {
    setPasswordReset({
      isOpen: true,
      user,
      newPassword: "",
      loading: false,
    });
  };

  const confirmPasswordReset = async () => {
    if (!passwordReset.user || !passwordReset.newPassword) return;

    try {
      setPasswordReset((prev) => ({ ...prev, loading: true }));
      await userAPI.resetPassword(
        passwordReset.user!.id!,
        passwordReset.newPassword,
      );
      setPasswordReset({
        isOpen: false,
        user: null,
        newPassword: "",
        loading: false,
      });
      alert("Password reset successfully!");
    } catch (error) {
      console.error("Failed to reset password:", error);
      setError(handleAPIError(error));
      setPasswordReset((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleUserModalSuccess = () => {
    fetchUsers();
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">
        <Users className="w-3 h-3 mr-1" />
        User
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by username, name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({totalUsers})</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Create your first user account"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {user.fullName || user.username}
                        </h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.isActive !== false)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Username:</span>{" "}
                          {user.username}
                        </div>
                        {user.employeeId && (
                          <div>
                            <span className="font-medium">Employee ID:</span>{" "}
                            {user.employeeId}
                          </div>
                        )}
                        {user.department && (
                          <div>
                            <span className="font-medium">Department:</span>{" "}
                            {user.department}
                          </div>
                        )}
                        {user.email && (
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div>
                            <span className="font-medium">Phone:</span>{" "}
                            {user.phone}
                          </div>
                        )}
                        {user.assignedCanteens &&
                          user.assignedCanteens.length > 0 && (
                            <div>
                              <span className="font-medium">Canteens:</span>{" "}
                              {user.assignedCanteens.join(", ")}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePasswordReset(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.username !== "super_admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={userModal.isOpen}
        onClose={() =>
          setUserModal({ isOpen: false, mode: "create", user: null })
        }
        onSuccess={handleUserModalSuccess}
        user={userModal.user}
        mode={userModal.mode}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ isOpen: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "
              {deleteConfirm.user?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <AlertDialog
        open={passwordReset.isOpen}
        onOpenChange={(open) =>
          !open &&
          setPasswordReset({
            isOpen: false,
            user: null,
            newPassword: "",
            loading: false,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new password for user "{passwordReset.user?.username}":
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={passwordReset.newPassword}
              onChange={(e) =>
                setPasswordReset((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              onKeyDown={(e) => e.key === "Enter" && confirmPasswordReset()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPasswordReset}
              disabled={
                passwordReset.newPassword.length < 6 || passwordReset.loading
              }
            >
              {passwordReset.loading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
