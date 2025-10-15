"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem("adminToken");

    if (token) {
      // Redirect to dashboard if already logged in
      router.push("/admin/dashboard");
    } else {
      // Redirect to login if not authenticated
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-slate-600">Redirecting to admin panel...</p>
      </div>
    </div>
  );
}
