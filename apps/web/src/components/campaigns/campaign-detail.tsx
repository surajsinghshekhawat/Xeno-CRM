"use client";

import type { CustomerTag } from "@xeno/shared";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { useCampaignSocket } from "@/hooks/use-campaign-socket";
import { RecipientTable, type RecipientRow } from "./recipient-table";

type CampaignDetail = {
  id: string;
  name: string;
  goal: string;
  channel: string;
  status: string;
  messageTemplate: string;
  segmentDefinition: unknown;
  segmentDescription: string;
  segmentSize: number;
  aiSummary: string | null;
  createdAt: string;
  completedAt: string | null;
  metrics: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    failedRate: number;
  };
  recipients: RecipientRow[];
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function buildRerunContext(campaign: CampaignDetail) {
  return {
    rerun: true,
    priorCampaignId: campaign.id,
    goal: campaign.goal,
    segmentDefinition: campaign.segmentDefinition,
    messageTemplate: campaign.messageTemplate,
    channel: campaign.channel,
    segmentHint: campaign.segmentDescription,
  };
}

export function CampaignDetailView({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => apiGet<CampaignDetail>(`/api/campaigns/${campaignId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SENDING" || status === "ACTIVE" ? 5000 : false;
    },
  });

  const isLive = data?.status === "SENDING" || data?.status === "ACTIVE";
  const { progress, completed } = useCampaignSocket(isLive ? campaignId : null);

  const displayMetrics = useMemo(() => {
    if (progress?.metrics) {
      return {
        total: progress.metrics.counts.total,
        sent: progress.metrics.counts.sent,
        delivered: progress.metrics.counts.delivered,
        opened: progress.metrics.counts.opened,
        clicked: progress.metrics.counts.clicked,
        converted: progress.metrics.counts.converted,
        failed: progress.metrics.counts.failed,
        deliveryRate: progress.metrics.deliveryRate,
        openRate: progress.metrics.openRate,
        clickRate: progress.metrics.clickRate,
        conversionRate: progress.metrics.conversionRate,
        failedRate: progress.metrics.failedRate,
      };
    }
    return data?.metrics;
  }, [data?.metrics, progress]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading campaign…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-rose-600">
        Campaign not found or API unavailable.
      </p>
    );
  }

  const metrics = displayMetrics ?? data.metrics;
  const rerunHref = `/campaigns/new?context=${encodeURIComponent(JSON.stringify(buildRerunContext(data)))}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{data.name}</h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
              {data.status}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
              {data.channel}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{data.goal}</p>
          <p className="mt-1 text-sm text-neutral-500">{data.segmentDescription}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={rerunHref}>Re-run campaign</Link>
        </Button>
      </div>

      {isLive && progress ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Live: {progress.progressPercent}% complete ({progress.terminalCount}/
          {progress.total} terminal)
          {completed ? " — campaign completed" : null}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => void refetch()}
          >
            Refresh
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Delivered" value={`${metrics.deliveryRate}%`} />
        <StatCard label="Opened" value={`${metrics.openRate}%`} />
        <StatCard label="Clicked" value={`${metrics.clickRate}%`} />
        <StatCard label="Converted" value={`${metrics.conversionRate}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recipients" value={String(metrics.total)} />
        <StatCard label="Failed" value={`${metrics.failed} (${metrics.failedRate}%)`} />
        <StatCard
          label="Launched"
          value={new Date(data.createdAt).toLocaleDateString("en-IN")}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">AI summary</h3>
        {data.aiSummary ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            {data.aiSummary}
          </p>
        ) : data.status === "COMPLETED" ? (
          <p className="mt-3 text-sm text-neutral-500">
            Summary is being generated…
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">
            AI summary will appear once the campaign completes.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="font-semibold">Recipients</h3>
        </div>
        <RecipientTable recipients={data.recipients} />
      </div>
    </div>
  );
}
