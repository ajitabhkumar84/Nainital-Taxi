import RouteCategoryForm from "@/components/admin/RouteCategoryForm";

export default function EditRouteCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  return <RouteCategoryForm categoryId={params.id} />;
}
