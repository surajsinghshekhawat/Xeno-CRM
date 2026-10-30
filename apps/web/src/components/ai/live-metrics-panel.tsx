"use client";

import { useCampaignSocket } from "@/hooks/use-campaign-socket";
import type { CampaignProgressPayload } from "@xeno/shared";

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function LiveMetricsPanel({
  campaignId,
  initialProgress,
}: {
  campaignId: string | null;
  initialProgress?: CampaignProgressPayload | null;
}) {
  const { connected, progress, updates, completed } = useCampaignSocket(
    campaignId,
  );

  const active = progress ?? initialProgress ?? null;

  if (!campaignId) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
        Launch a campaign to see live delivery metrics here.
      </div>
    );
  }

  if (!active) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        {connected ? "Waiting for live events…" : "Connecting to live feed…"}
      </div>
    );
  }

  const metrics = active.metrics;

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Live metrics</h3>
        <span className="text-xs text-neutral-500">
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      <ProgressBar percent={active.progressPercent} />
      <p className="text-sm text-neutral-600">
        {active.progressPercent}% complete · {active.status}
        {completed ? " · Done" : ""}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Delivered</p>
          <p className="font-medium">{metrics.deliveryRate}%</p>
        </div>
        <div className="rounded-md bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Opened</p>
          <p className="font-medium">{metrics.openRate}%</p>
        </div>
        <div className="rounded-md bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Clicked</p>
          <p className="font-medium">{metrics.clickRate}%</p>
        </div>
        <div className="rounded-md bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Converted</p>
          <p className="font-medium">{metrics.conversionRate}%</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase text-neutral-500">
          Recent events
        </p>
        <ul className="space-y-1 text-xs text-neutral-600">
          {updates.slice(0, 5).map((update) => (
            <li key={`${update.recipientId}-${update.timestamp}`}>
              {update.event} → {update.status}
            </li>
          ))}
          {updates.length === 0 ? <li>No events yet</li> : null}
        </ul>
      </div>
    </div>
  );
}
