"use client";

import Link from "next/link";

type RecentCampaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  createdAt: string;
  segmentSize: number;
  openRate: number;
  keyMetric: string;
};

export function RecentCampaigns({
  campaigns,
}: {
  campaigns: RecentCampaign[];
}) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No campaigns yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={`/campaigns/${campaign.id}`}
          className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium">{campaign.name}</h3>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {campaign.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            {campaign.channel} · {campaign.segmentSize} recipients
          </p>
          <p className="mt-3 text-sm font-medium">{campaign.keyMetric}</p>
        </Link>
      ))}
    </div>
  );
}
