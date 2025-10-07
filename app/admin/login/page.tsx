"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { adminApi } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic client-side validation
    if (!formData.username.trim()) {
      setError("Please enter your username.");
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("Please enter your password.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminApi.login(formData.username, formData.password);

      // Store admin token and info
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminInfo", JSON.stringify(data.admin));

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (error: unknown) {
      console.error("Admin login error:", error);

      // Handle specific error cases based on status codes
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 401) {
        setError(
          "Invalid username or password. Please check your credentials."
        );
      } else if (errorObj.status === 404) {
        setError(
          "Admin account not found. Please contact system administrator."
        );
      } else if (errorObj.status === 403) {
        setError("Access denied. Your account may not have admin privileges.");
      } else if (errorObj.status === 500) {
        setError("Server error. Please try again later.");
      } else if (errorObj.message?.includes("Network")) {
        setError("Network error. Please check your connection and try again.");
      } else if (
        errorObj.message?.includes("Invalid") ||
        errorObj.message?.includes("invalid")
      ) {
        setError(
          "Invalid credentials. Please check your username and password."
        );
      } else {
        setError(
          errorObj.message ||
            "Login failed. Please check your credentials and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">Secure admin access only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
