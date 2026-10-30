"use client";

import { BRAND, CUSTOMER_TAGS, type CustomerTag } from "@xeno/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TagBadge } from "@/components/data/tag-badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tag: CustomerTag;
  totalSpend: number;
  orderCount: number;
  lastPurchaseAt: string | null;
  city: string | null;
};

type CustomerListResponse = {
  data: CustomerRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function formatCurrency(value: number) {
  return `${BRAND.currencySymbol}${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomerTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("page")) params.set("page", "1");
    if (!params.get("pageSize")) params.set("pageSize", "20");
    if (!params.get("sortBy")) params.set("sortBy", "totalSpend");
    if (!params.get("sortOrder")) params.set("sortOrder", "desc");
    return params.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", queryString],
    queryFn: () => apiGet<CustomerListResponse>(`/api/customers?${queryString}`),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/data/customers?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Search
          </label>
          <input
            className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            defaultValue={searchParams.get("search") ?? ""}
            placeholder="Name or email"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateParam("search", event.currentTarget.value.trim());
              }
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Tag
          </label>
          <select
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
            value={searchParams.get("tags") ?? ""}
            onChange={(event) => updateParam("tags", event.target.value)}
          >
            <option value="">All tags</option>
            {CUSTOMER_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Sort
          </label>
          <select
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
            value={`${searchParams.get("sortBy") ?? "totalSpend"}:${searchParams.get("sortOrder") ?? "desc"}`}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(":");
              const params = new URLSearchParams(searchParams.toString());
              params.set("sortBy", sortBy);
              params.set("sortOrder", sortOrder);
              params.set("page", "1");
              router.push(`/data/customers?${params.toString()}`);
            }}
          >
            <option value="totalSpend:desc">Spend (high → low)</option>
            <option value="totalSpend:asc">Spend (low → high)</option>
            <option value="orderCount:desc">Orders (most)</option>
            <option value="lastPurchaseAt:desc">Last purchase (recent)</option>
            <option value="name:asc">Name (A → Z)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {isLoading ? (
          <p className="p-8 text-sm text-neutral-500">Loading customers…</p>
        ) : error ? (
          <p className="p-8 text-sm text-rose-600">
            Failed to load customers. Is the CRM API running?
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Total Spend</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Last Purchase</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{customer.email}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TagBadge tag={customer.tag} />
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(customer.totalSpend)}
                  </td>
                  <td className="px-4 py-3">{customer.orderCount}</td>
                  <td className="px-4 py-3">
                    {formatDate(customer.lastPurchaseAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/data/customers/${customer.id}`}
                      className="text-neutral-900 underline-offset-2 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data ? (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            {data.pagination.total} customers · page {data.pagination.page} of{" "}
            {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(data.pagination.page - 1));
                router.push(`/data/customers?${params.toString()}`);
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
                router.push(`/data/customers?${params.toString()}`);
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
