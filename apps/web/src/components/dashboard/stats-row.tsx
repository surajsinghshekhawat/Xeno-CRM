"use client";

import { BRAND } from "@xeno/shared";

export function StatsRow({
  stats,
}: {
  stats: {
    totalCustomers: number;
    totalRevenue: number;
    activeCampaigns: number;
    avgOpenRate: number;
  };
}) {
  const cards = [
    {
      label: "Total customers",
      value: stats.totalCustomers.toLocaleString("en-IN"),
    },
    {
      label: "Total revenue",
      value: `${BRAND.currencySymbol}${stats.totalRevenue.toLocaleString("en-IN")}`,
    },
    {
      label: "Active campaigns",
      value: String(stats.activeCampaigns),
    },
    {
      label: "Avg open rate",
      value: `${stats.avgOpenRate}%`,
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
        </div>
      ))}
    </div>
  );
}
