import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OrderTable } from "@/components/data/order-table";

export default function OrdersPage() {
  return (
    <AppShell
      title="Orders"
      description="Browse orders with channel and status filters."
    >
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <OrderTable />
      </Suspense>
    </AppShell>
  );
}
