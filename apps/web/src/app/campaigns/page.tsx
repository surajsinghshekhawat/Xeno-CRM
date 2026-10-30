import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CampaignTable } from "@/components/campaigns/campaign-table";

export default function CampaignsPage() {
  return (
    <AppShell
      title="Campaign Tracker"
      description="All campaigns with delivery and engagement metrics."
    >
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <CampaignTable />
      </Suspense>
    </AppShell>
  );
}
