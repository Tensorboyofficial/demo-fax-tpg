import { getAllFaxes } from "@/backend/services/data-merge.service";
import { CATEGORY_CONFIG } from "@/backend/config/category.config";
import { SchemasTable } from "@/frontend/components/features/fax/schemas-table";

export const dynamic = "force-dynamic";

export default async function SchemasPage() {
  const allFaxes = await getAllFaxes();

  // Count faxes and find earliest date per category
  const countByCategory: Record<string, number> = {};
  const earliestByCategory: Record<string, string> = {};
  for (const fax of allFaxes) {
    const cat = fax.type;
    countByCategory[cat] = (countByCategory[cat] ?? 0) + 1;
    if (!earliestByCategory[cat] || fax.receivedAt < earliestByCategory[cat]) {
      earliestByCategory[cat] = fax.receivedAt;
    }
  }

  const schemas = CATEGORY_CONFIG.map((c) => ({
    category: c.category,
    label: c.label,
    fileCount: countByCategory[c.category] ?? 0,
    splittable: c.splittable,
    alwaysReview: c.always_human_review,
    earliestFaxDate: earliestByCategory[c.category] ?? null,
  }));

  return <SchemasTable schemas={schemas} />;
}

export function generateMetadata() {
  return { title: "Schemas · Cevi" };
}
