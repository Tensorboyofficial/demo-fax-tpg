import { notFound } from "next/navigation";
import { getFaxByIdMerged, getEventsForFax } from "@/lib/data-merge";
import { DetailShell } from "@/components/detail/DetailShell";

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
