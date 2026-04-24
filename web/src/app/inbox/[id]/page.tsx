import { notFound } from "next/navigation";
import { getFaxByIdMerged, getEventsForFax } from "@/backend/services/data-merge.service";
import { DetailShell } from "@/frontend/components/features/fax/detail-shell";

export const dynamic = "force-dynamic";

export default async function FaxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fax = await getFaxByIdMerged(id);
  if (!fax) notFound();

  const events = await getEventsForFax(id);

  return <DetailShell fax={fax} initialEvents={events} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fax = await getFaxByIdMerged(id);
  return {
    title: fax ? `${fax.fromOrg} · Fax ${fax.id} · Cevi` : "Fax not found",
  };
}
