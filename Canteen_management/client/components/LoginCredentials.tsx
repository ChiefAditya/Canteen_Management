import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info, Users, Shield, Copy, CheckCircle } from "lucide-react";

export default function LoginCredentials() {
  const [copiedText, setCopiedText] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const adminCredentials = [
    {
      username: "super_admin",
      password: "super@123",
      role: "Administrator",
      description: "System access",
    },
    {
      username: "canteen_a_admin",
      password: "canteenadmin@123",
      role: "Administrator",
      description: "System access",
    },
    {
      username: "canteen_b_admin",
      password: "canteenbadmin@123",
      role: "Administrator",
      description: "System access",
    },
  ];

  const userCredentials = [
    {
      username: "demo_user1",
      password: "demo123",
      role: "User",
      description: "Demo access only",
    },
    {
      username: "demo_user2",
      password: "demo123",
      role: "User",
      description: "Demo access only",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Info className="w-3 h-3 mr-1" />
          Demo Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Demo Login Credentials
          </DialogTitle>
          <DialogDescription>
            Use these credentials to test different access levels in the canteen
            management system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Credentials */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Admin Access</h3>
              <Badge variant="secondary" className="text-xs">
                Management Portal
              </Badge>
            </div>
            <div className="space-y-2">
              {adminCredentials.map((cred, index) => (
                <div
                  key={index}
                  className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{cred.role}</span>
                    <span className="text-xs text-gray-500">
                      {cred.description}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Username:</span>
                      <code className="bg-white px-1 rounded">
                        {cred.username}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() =>
                          copyToClipboard(cred.username, `admin-user-${index}`)
                        }
                      >
                        {copiedText === `admin-user-${index}` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Password:</span>
                      <code className="bg-white px-1 rounded">
                        {cred.password}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() =>
                          copyToClipboard(cred.password, `admin-pass-${index}`)
                        }
                      >
                        {copiedText === `admin-pass-${index}` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Credentials */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-sm">User Access</h3>
              <Badge variant="secondary" className="text-xs">
                Ordering Portal
              </Badge>
            </div>
            <div className="space-y-2">
              {userCredentials.map((cred, index) => (
                <div
                  key={index}
                  className="bg-green-50 rounded-lg p-3 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{cred.role}</span>
                    <span className="text-xs text-gray-500">
                      {cred.description}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Username:</span>
                      <code className="bg-white px-1 rounded">
                        {cred.username}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() =>
                          copyToClipboard(cred.username, `user-user-${index}`)
                        }
                      >
                        {copiedText === `user-user-${index}` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Password:</span>
                      <code className="bg-white px-1 rounded">
                        {cred.password}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() =>
                          copyToClipboard(cred.password, `user-pass-${index}`)
                        }
                      >
                        {copiedText === `user-pass-${index}` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-medium text-sm mb-2">
              Authentication Features:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Role-based access control (Admin vs User)</li>
              <li>• Session validation and token expiry (24 hours)</li>
              <li>• Different permission sets for each role</li>
              <li>• Protected routes based on authentication status</li>
              <li>• Automatic redirect based on user role</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
