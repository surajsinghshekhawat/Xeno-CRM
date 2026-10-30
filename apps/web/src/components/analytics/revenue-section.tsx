"use client";

import { BRAND } from "@xeno/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsOverview } from "./types";

const ORDER_CHANNEL_LABELS: Record<string, string> = {
  ONLINE: "Online",
  IN_STORE: "In store",
  APP: "App",
};

export function RevenueSection({
  revenueTrend,
  revenueByOrderChannel,
  recentPeriodRevenue,
}: {
  revenueTrend: AnalyticsOverview["revenueTrend"];
  revenueByOrderChannel: AnalyticsOverview["revenueByOrderChannel"];
  recentPeriodRevenue: number;
}) {
  const trendData = revenueTrend.map((row) => ({
    ...row,
    label: new Date(row.week).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
  }));

  const channelData = revenueByOrderChannel.map((row) => ({
    channel: ORDER_CHANNEL_LABELS[row.channel] ?? row.channel,
    revenue: row.revenue,
    orders: row.orders,
  }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revenue & orders</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Last 8 weeks of completed orders ·{" "}
          {BRAND.currencySymbol}
          {recentPeriodRevenue.toLocaleString("en-IN")} in period
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Weekly revenue</h3>
          {trendData.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders in this period</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name) => [
                      name === "revenue"
                        ? `${BRAND.currencySymbol}${value.toLocaleString("en-IN")}`
                        : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Revenue by order channel</h3>
          {channelData.length === 0 ? (
            <p className="text-sm text-neutral-500">No order data</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      `${BRAND.currencySymbol}${value.toLocaleString("en-IN")}`
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#737373"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
