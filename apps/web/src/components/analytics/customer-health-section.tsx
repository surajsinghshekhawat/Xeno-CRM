"use client";

import { BRAND } from "@xeno/shared";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TAG_META } from "./types";

export function CustomerHealthSection({
  customerHealth,
  recency,
}: {
  customerHealth: {
    tag: string;
    count: number;
    avgSpend: number;
    totalSpend: number;
    share: number;
  }[];
  recency: { bucket: string; count: number }[];
}) {
  const pieData = customerHealth
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: TAG_META[d.tag]?.label ?? d.tag,
      fill: TAG_META[d.tag]?.color ?? "#a3a3a3",
    }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Customer health</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Segments based on purchase recency, spend, and order history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Segment distribution</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-neutral-500">No customer data</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.tag} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      `${value} customers (${item.payload.share}%)`,
                      item.payload.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold">Purchase recency</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recency} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="bucket"
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Segment</th>
              <th className="px-4 py-3 font-medium">What it means</th>
              <th className="px-4 py-3 font-medium text-right">Customers</th>
              <th className="px-4 py-3 font-medium text-right">Share</th>
              <th className="px-4 py-3 font-medium text-right">Avg spend</th>
              <th className="px-4 py-3 font-medium text-right">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {customerHealth.map((row) => {
              const meta = TAG_META[row.tag];
              return (
                <tr
                  key={row.tag}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: meta?.color ?? "#a3a3a3" }}
                      />
                      {meta?.label ?? row.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {meta?.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">{row.count}</td>
                  <td className="px-4 py-3 text-right">{row.share}%</td>
                  <td className="px-4 py-3 text-right">
                    {BRAND.currencySymbol}
                    {row.avgSpend.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {BRAND.currencySymbol}
                    {row.totalSpend.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
