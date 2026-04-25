import { InboxTable } from "@/frontend/components/features/fax/inbox-table";
import { getAllFaxes } from "@/backend/services/data-merge.service";

export const metadata = { title: "Home · Cevi" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let allFaxes: Awaited<ReturnType<typeof getAllFaxes>> = [];
  try {
    allFaxes = await getAllFaxes();
  } catch (err) {
    console.error("[HomePage] getAllFaxes failed:", err);
  }

  return (
    <div className="-mx-4 -my-3 md:-mx-10 md:-my-6">
      <InboxTable faxes={allFaxes} />
    </div>
  );
}
