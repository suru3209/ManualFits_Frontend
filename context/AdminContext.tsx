"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Admin {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
}

interface AdminContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Fetch admin profile from backend to get complete data
      const fetchAdminProfile = async () => {
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8080";

          const response = await fetch(`${backendUrl}/api/admin/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setAdmin({
              id: data.admin._id,
              username: data.admin.username,
              role: data.admin.role,
              permissions: data.admin.permissions || [],
              lastLogin: data.admin.lastLogin,
            });
          } else {
            // Fallback to JWT decode if API fails
            const payload = JSON.parse(atob(token.split(".")[1]));
            setAdmin({
              id: payload.id,
              username: payload.username,
              role: payload.role,
              permissions: payload.permissions || [],
              lastLogin: payload.iat
                ? new Date(payload.iat * 1000).toISOString()
                : undefined,
            });
          }
        } catch (error) {
          console.error("Failed to fetch admin profile:", error);
          // Fallback to JWT decode
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setAdmin({
              id: payload.id,
              username: payload.username,
              role: payload.role,
              permissions: payload.permissions || [],
              lastLogin: payload.iat
                ? new Date(payload.iat * 1000).toISOString()
                : undefined,
            });
          } catch (jwtError) {
            console.error("Failed to decode admin token:", jwtError);
            localStorage.removeItem("adminToken");
          }
        }
      };

      fetchAdminProfile();
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("rememberMe");
    setAdmin(null);
    window.location.href = "/admin/login";
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    // Super admin has all permissions
    if (admin.role === "super_admin" || admin.permissions.includes("*"))
      return true;
    return admin.permissions.includes(permission);
  };

  return (
    <AdminContext.Provider value={{ admin, setAdmin, logout, hasPermission }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
