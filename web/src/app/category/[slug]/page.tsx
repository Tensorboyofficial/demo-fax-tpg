import { notFound } from "next/navigation";
import { getAllFaxes } from "@/backend/services/data-merge.service";
import { CategoryTable } from "@/frontend/components/features/fax/category-table";
import { CATEGORY_CONFIG } from "@/backend/config/category.config";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = CATEGORY_CONFIG.find((c) => c.category === slug);
  if (!config) notFound();

  const allFaxes = await getAllFaxes();

  // Map legacy type values → canonical category slugs
  const LEGACY_MAP: Record<string, string> = {
    lab_result: "lab",
    specialist_consult: "consult",
    imaging_report: "imaging",
    rx_refill: "other",
    unknown: "other",
  };
  const faxes = allFaxes.filter(
    (f) => f.type === slug || LEGACY_MAP[f.type] === slug,
  );

  return (
    <div>
      <CategoryTable faxes={faxes} category={slug} label={config.label} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = CATEGORY_CONFIG.find((c) => c.category === slug);
  return {
    title: config ? `${config.label} · Cevi` : "Category · Cevi",
  };
}
