import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerDetailView } from "@/components/data/customer-detail";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AppShell
      title="Customer Detail"
      description={
        <>
          <Link
            href="/data/customers"
            className="text-neutral-600 underline-offset-2 hover:underline"
          >
            ← Back to customers
          </Link>
        </>
      }
    >
      <CustomerDetailView customerId={params.id} />
    </AppShell>
  );
}
