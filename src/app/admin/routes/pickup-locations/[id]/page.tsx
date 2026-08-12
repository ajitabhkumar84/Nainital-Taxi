import PickupLocationForm from "@/components/admin/PickupLocationForm";

export default function EditPickupLocationPage({
  params,
}: {
  params: { id: string };
}) {
  return <PickupLocationForm locationId={params.id} />;
}
