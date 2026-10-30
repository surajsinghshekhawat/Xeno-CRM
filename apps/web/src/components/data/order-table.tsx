"use client";

import { BRAND, ORDER_CHANNELS, ORDER_STATUSES } from "@xeno/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";

type OrderRow = {
  id: string;
  customerName: string;
  items: unknown;
  totalValue: number;
  channel: string;
  status: string;
  createdAt: string;
};

type OrderListResponse = {
  data: OrderRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function shortId(id: string) {
  return id.slice(0, 8);
}

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
  return names.length ? names.join(", ") : "—";
}

export function OrderTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("page")) params.set("page", "1");
    return params.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", queryString],
    queryFn: () => apiGet<OrderListResponse>(`/api/orders?${queryString}`),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/data/orders?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          className="h-9 min-w-[200px] flex-1 rounded-md border border-neutral-200 px-3 text-sm"
          defaultValue={searchParams.get("search") ?? ""}
          placeholder="Search customer name"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              updateParam("search", event.currentTarget.value.trim());
            }
          }}
        />
        <select
          className="h-9 rounded-md border border-neutral-200 px-3 text-sm"
          value={searchParams.get("channel") ?? ""}
          onChange={(event) => updateParam("channel", event.target.value)}
        >
          <option value="">All channels</option>
          {ORDER_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-neutral-200 px-3 text-sm"
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParam("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {isLoading ? (
          <p className="p-8 text-sm text-neutral-500">Loading orders…</p>
        ) : error ? (
          <p className="p-8 text-sm text-rose-600">Failed to load orders.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-mono text-xs">
                    {shortId(order.id)}
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
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
        )}
      </div>

      {data ? (
        <div className="flex items-center justify-between text-sm">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(data.pagination.page - 1));
                router.push(`/data/orders?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(data.pagination.page + 1));
                router.push(`/data/orders?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
