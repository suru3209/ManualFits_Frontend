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
      // Decode token to get admin info (basic JWT decode)
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
      } catch (error) {
        console.error("Failed to decode admin token:", error);
        localStorage.removeItem("adminToken");
      }
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
    if (admin.role === "super_admin") return true;
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
