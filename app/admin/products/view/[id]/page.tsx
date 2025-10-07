import { Suspense } from "react";
import AdminProductView from "@/components/admin/AdminProductView";

interface AdminProductViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminProductViewPage({
  params,
}: AdminProductViewPageProps) {
  const { id } = await params;
  return <AdminProductView productId={id} />;
}
