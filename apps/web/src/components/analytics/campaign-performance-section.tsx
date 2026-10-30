"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHANNEL_COLORS, type AnalyticsOverview } from "./types";

function FunnelStep({
  label,
  count,
  rate,
  total,
}: {
  label: string;
  count: number;
  rate?: number;
  total: number;
}) {
  const width = total > 0 ? Math.max((count / total) * 100, 4) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-600">
          {count.toLocaleString("en-IN")}
          {rate !== undefined ? ` · ${rate}%` : ""}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function CampaignPerformanceSection({
  globalFunnel,
  channelPerformance,
  campaignPerformance,
}: {
  globalFunnel: AnalyticsOverview["globalFunnel"];
  channelPerformance: AnalyticsOverview["channelPerformance"];
  campaignPerformance: AnalyticsOverview["campaignPerformance"];
}) {
  const { counts } = globalFunnel;

  const channelChartData = channelPerformance.map((ch) => ({
    channel: ch.channel,
    "Open rate": ch.openRate,
    "Click rate": ch.clickRate,
    "Conversion rate": ch.conversionRate,
    fill: CHANNEL_COLORS[ch.channel] ?? "#737373",
  }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Campaign performance</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Delivery funnel and engagement across all campaigns and channels.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Global delivery funnel</h3>
          <div className="space-y-4">
            <FunnelStep
              label="Recipients"
              count={counts.total}
              total={counts.total}
            />
            <FunnelStep
              label="Delivered"
              count={counts.delivered}
              rate={globalFunnel.deliveryRate}
              total={counts.total}
            />
            <FunnelStep
              label="Opened"
              count={counts.opened}
              rate={globalFunnel.openRate}
              total={counts.total}
            />
            <FunnelStep
              label="Clicked"
              count={counts.clicked}
              rate={globalFunnel.clickRate}
              total={counts.total}
            />
            <FunnelStep
              label="Converted"
              count={counts.converted}
              rate={globalFunnel.conversionRate}
              total={counts.total}
            />
            {counts.failed > 0 ? (
              <p className="text-xs text-rose-600">
                {counts.failed} failed ({globalFunnel.failedRate}% failure rate)
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">
            Engagement by channel
          </h3>
          {channelChartData.length === 0 ? (
            <p className="text-sm text-neutral-500">No campaign data yet</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Open rate" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Click rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="Conversion rate"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Audience</th>
              <th className="px-4 py-3 font-medium text-right">Delivered</th>
              <th className="px-4 py-3 font-medium text-right">Open</th>
              <th className="px-4 py-3 font-medium text-right">Click</th>
              <th className="px-4 py-3 font-medium text-right">Convert</th>
            </tr>
          </thead>
          <tbody>
            {campaignPerformance.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  No campaigns yet — launch one from the AI Console.
                </td>
              </tr>
            ) : (
              campaignPerformance.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">
                      {campaign.goal}
                    </p>
                  </td>
                  <td className="px-4 py-3">{campaign.channel}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.segmentSize}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.metrics.deliveryRate}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.metrics.openRate}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.metrics.clickRate}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.metrics.conversionRate}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
