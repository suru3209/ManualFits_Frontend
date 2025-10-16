"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Shield,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

interface AdminProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfile() {
  const router = useRouter();
  const { admin } = useAdmin();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  useEffect(() => {
    if (admin) {
      setProfile(admin);
      setFormData({
        username: admin.username || "",
        email: admin.email || "",
      });
      setIsLoading(false);
    }
  }, [admin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    // Basic validation
    if (!formData.username.trim()) {
      setAlert({
        type: "error",
        message: "Username is required",
      });
      return;
    }

    if (!formData.email.trim()) {
      setAlert({
        type: "error",
        message: "Email is required",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlert({
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }

    setIsSaving(true);
    setAlert(null);

    try {
      const token = localStorage.getItem("adminToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";

      const response = await fetch(`${backendUrl}/api/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const updatedAdmin = await response.json();
        setProfile(updatedAdmin.admin);
        setIsEditing(false);
        setAlert({
          type: "success",
          message: "Profile updated successfully!",
        });

        // Update the admin context
        localStorage.setItem("adminData", JSON.stringify(updatedAdmin.admin));

        // Clear alert after 3 seconds
        setTimeout(() => setAlert(null), 3000);
      } else {
        const error = await response.json();
        setAlert({
          type: "error",
          message: error.message || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setAlert({
        type: "error",
        message: "An error occurred while updating your profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        email: profile.email || "",
      });
    }
    setIsEditing(false);
    setAlert(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
            <div className="h-4 w-64 bg-slate-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 w-full bg-slate-200 rounded"></div>
              <div className="h-10 w-full bg-slate-200 rounded"></div>
              <div className="h-10 w-full bg-slate-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
        <p className="text-slate-600 mb-4">
          Unable to load your profile information
        </p>
        <Button onClick={() => router.push("/admin/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="text-slate-600 mt-1">
              Manage your admin account information
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          className={
            alert.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }
        >
          {alert.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription
            className={
              alert.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Username</span>
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your username"
              className="disabled:bg-slate-50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your email address"
              className="disabled:bg-slate-50"
            />
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Role</span>
            </Label>
            <Input
              id="role"
              value={profile.role?.replace("_", " ").toUpperCase() || "ADMIN"}
              disabled
              className="disabled:bg-slate-50"
            />
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="font-medium">Account Created:</span>
                <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <p>{new Date(profile.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">
                Security Information
              </h4>
              <p className="text-sm text-amber-700">
                For security reasons, password changes and other sensitive
                account modifications must be handled by a system administrator.
                Contact your system administrator if you need to change your
                password or modify other security settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
