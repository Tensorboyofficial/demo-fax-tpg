import { notFound } from "next/navigation";
import { getAllFaxes } from "@/backend/services/data-merge.service";
import { CategoryTable } from "@/frontend/components/features/fax/category-table";
import { getCategoryConfig } from "@/backend/config/category.config";
import { CATEGORY_TO_LEGACY } from "@/shared/constants";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getCategoryConfig(slug);
  if (!config) notFound();

  const allFaxes = await getAllFaxes();

  // Match faxes by: exact category match, legacy alias, or schema_key match
  const legacyName = CATEGORY_TO_LEGACY[slug];
  const faxes = allFaxes.filter(
    (f) =>
      f.type === slug ||
      f.type === config.category ||
      (legacyName && f.type === legacyName) ||
      f.type === config.schema_key,
  );

  return (
    <div>
      <CategoryTable faxes={faxes} category={config.category} label={config.label} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getCategoryConfig(slug);
  return {
    title: config ? `${config.label} · Cevi` : "Category · Cevi",
  };
}
