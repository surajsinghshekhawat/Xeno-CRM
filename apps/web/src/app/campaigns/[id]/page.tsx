import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CampaignDetailView } from "@/components/campaigns/campaign-detail";

export default function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AppShell
      title="Campaign Detail"
      description={
        <Link
          href="/campaigns"
          className="text-neutral-600 underline-offset-2 hover:underline"
        >
          ← Back to campaigns
        </Link>
      }
    >
      <CampaignDetailView campaignId={params.id} />
    </AppShell>
  );
}
