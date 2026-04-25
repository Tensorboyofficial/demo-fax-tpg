import { InboxTable } from "@/frontend/components/features/fax/inbox-table";
import { getAllFaxes } from "@/backend/services/data-merge.service";

export const metadata = { title: "Home · Cevi" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allFaxes = await getAllFaxes();

  return (
    <div className="-mx-6 md:-mx-10 -my-6">
      <InboxTable faxes={allFaxes} />
    </div>
  );
}
