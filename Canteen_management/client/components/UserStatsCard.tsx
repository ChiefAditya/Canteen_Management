import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { userAPI, handleAPIError } from "@/lib/api";

interface UserStatsCardProps {
  onManageUsers: () => void;
}

export default function UserStatsCard({ onManageUsers }: UserStatsCardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentUsers: 0,
    inactiveUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const userStats = await userAPI.getStats();
        setStats(userStats);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        setError(handleAPIError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-gray-600">Loading user statistics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>User Management</span>
          </div>
          <Button
            size="sm"
            onClick={onManageUsers}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Manage
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalUsers}
            </div>
            <div className="text-xs text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.activeUsers}
            </div>
            <div className="text-xs text-gray-600">Active Users</div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Role Distribution
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Administrators</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800"
            >
              {stats.adminUsers}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Regular Users</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {stats.regularUsers}
            </Badge>
          </div>
        </div>

        {/* Status Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Status Overview</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Active</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.activeUsers}
            </Badge>
          </div>
          {stats.inactiveUsers > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Inactive</span>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {stats.inactiveUsers}
              </Badge>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {stats.recentUsers > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>
                {stats.recentUsers} new user{stats.recentUsers !== 1 ? "s" : ""}{" "}
                added in last 30 days
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onManageUsers}
            className="w-full"
          >
            View All Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
