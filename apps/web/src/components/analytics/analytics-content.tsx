"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { CampaignPerformanceSection } from "@/components/analytics/campaign-performance-section";
import { CustomerHealthSection } from "@/components/analytics/customer-health-section";
import { RevenueSection } from "@/components/analytics/revenue-section";
import type { AnalyticsOverview } from "@/components/analytics/types";
import { apiGet } from "@/lib/api-client";

export function AnalyticsContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => apiGet<AnalyticsOverview>("/api/analytics/overview"),
  });

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading analytics…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-rose-600">
        Analytics unavailable. Start the CRM API and seed the database.
      </p>
    );
  }

  return (
    <div className="space-y-12">
      <AnalyticsSummary summary={data.summary} />
      <CustomerHealthSection
        customerHealth={data.customerHealth}
        recency={data.recency}
      />
      <CampaignPerformanceSection
        globalFunnel={data.globalFunnel}
        channelPerformance={data.channelPerformance}
        campaignPerformance={data.campaignPerformance}
      />
      <RevenueSection
        revenueTrend={data.revenueTrend}
        revenueByOrderChannel={data.revenueByOrderChannel}
        recentPeriodRevenue={data.recentPeriodRevenue}
      />
    </div>
  );
}
