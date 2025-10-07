import ProductAddEdit from "@/components/admin/ProductAddEdit";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  return <ProductAddEdit productId={id} isEdit={true} />;
}
