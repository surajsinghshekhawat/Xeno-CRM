"use client";

import { BRAND } from "@xeno/shared";
import type { AnalyticsOverview } from "./types";

export function AnalyticsSummary({
  summary,
}: {
  summary: AnalyticsOverview["summary"];
}) {
  const cards = [
    {
      label: "Total customers",
      value: summary.totalCustomers.toLocaleString("en-IN"),
      sub: `${summary.healthyCustomerPct}% healthy · ${summary.atRiskCustomerPct}% at risk`,
    },
    {
      label: "Lifetime revenue",
      value: `${BRAND.currencySymbol}${summary.totalRevenue.toLocaleString("en-IN")}`,
      sub: `Avg order ${BRAND.currencySymbol}${summary.avgOrderValue.toLocaleString("en-IN")}`,
    },
    {
      label: "Campaigns sent",
      value: String(summary.totalCampaigns),
      sub: `${summary.totalOrders.toLocaleString("en-IN")} completed orders`,
    },
    {
      label: "Customers needing attention",
      value: String(summary.atRiskCount),
      sub: `${summary.healthyCount} healthy (VIP + Regular + New)`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          <p className="mt-1 text-xs text-neutral-500">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
