"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { StatsRow } from "@/components/dashboard/stats-row";
import { apiGet } from "@/lib/api-client";
import type { Insight, InsightsResponse } from "@xeno/shared";

type DashboardStats = {
  totalCustomers: number;
  totalRevenue: number;
  activeCampaigns: number;
  avgOpenRate: number;
  recentCampaigns: {
    id: string;
    name: string;
    channel: string;
    status: string;
    createdAt: string;
    segmentSize: number;
    openRate: number;
    keyMetric: string;
  }[];
};

export function DashboardContent() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiGet<DashboardStats>("/api/dashboard/stats"),
  });

  const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: () => apiGet<InsightsResponse>("/api/insights"),
  });

  if (statsQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading dashboard…</p>;
  }

  if (statsQuery.error || !statsQuery.data) {
    return (
      <p className="text-sm text-rose-600">
        Dashboard unavailable. Start the CRM API and seed the database.
      </p>
    );
  }

  const insight: Insight | null = insightsQuery.data?.insight ?? null;

  return (
    <div className="space-y-8">
      <StatsRow stats={statsQuery.data} />
      <InsightBanner insight={insight} />
      <Link
        href="/analytics"
        className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50"
      >
        <div>
          <h2 className="font-semibold">Analytics</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Customer health segments, campaign funnel metrics, and revenue
            trends.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-neutral-400" />
      </Link>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent campaigns</h2>
          <Link
            href="/analytics"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            View all metrics →
          </Link>
        </div>
        <RecentCampaigns campaigns={statsQuery.data.recentCampaigns} />
      </section>
    </div>
  );
}
