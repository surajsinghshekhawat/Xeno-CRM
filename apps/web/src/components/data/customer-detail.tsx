"use client";

import { BRAND, type CustomerTag } from "@xeno/shared";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TagBadge } from "@/components/data/tag-badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";

type OrderRow = {
  id: string;
  items: unknown;
  totalValue: number;
  channel: string;
  status: string;
  createdAt: string;
};

type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tag: CustomerTag;
  totalSpend: number;
  orderCount: number;
  lastPurchaseAt: string | null;
  city: string | null;
  ageGroup: string | null;
  gender: string | null;
  createdAt: string;
  orders: OrderRow[];
};

function formatCurrency(value: number) {
  return `${BRAND.currencySymbol}${value.toLocaleString("en-IN")}`;
}

function summarizeItems(items: unknown) {
  if (!Array.isArray(items)) return "—";
  const names = items
    .map((item) =>
      typeof item === "object" && item && "name" in item
        ? String((item as { name: string }).name)
        : null,
    )
    .filter(Boolean)
    .slice(0, 2);
  if (names.length === 0) return "—";
  return names.join(", ");
}

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => apiGet<CustomerDetail>(`/api/customers/${customerId}`),
  });

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading customer…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-rose-600">
        Customer not found or API unavailable.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{data.name}</h2>
              <TagBadge tag={data.tag} />
            </div>
            <p className="mt-2 text-sm text-neutral-600">{data.email}</p>
            <p className="text-sm text-neutral-600">{data.phone ?? "No phone"}</p>
          </div>
          <Button asChild>
            <Link
              href={`/campaigns/new?context=${encodeURIComponent(
                JSON.stringify({
                  goal: `Create a campaign for ${data.name}`,
                  segmentDefinition: { customerId: data.id },
                }),
              )}`}
            >
              Create Campaign
            </Link>
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-neutral-500">Total spend</dt>
            <dd className="mt-1 font-medium">
              {formatCurrency(data.totalSpend)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-500">Orders</dt>
            <dd className="mt-1 font-medium">{data.orderCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-500">City</dt>
            <dd className="mt-1 font-medium">{data.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-500">Member since</dt>
            <dd className="mt-1 font-medium">
              {new Date(data.createdAt).toLocaleDateString("en-IN")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="font-medium">Order history</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-100">
                <td className="px-4 py-3">{summarizeItems(order.items)}</td>
                <td className="px-4 py-3">
                  {formatCurrency(order.totalValue)}
                </td>
                <td className="px-4 py-3">{order.channel}</td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
