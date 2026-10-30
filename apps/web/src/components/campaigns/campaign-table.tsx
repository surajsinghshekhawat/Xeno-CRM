"use client";

import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES } from "@xeno/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";

type CampaignRow = {
  id: string;
  name: string;
  channel: string;
  status: string;
  segmentSize: number;
  createdAt: string;
  metrics: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
};

type CampaignListResponse = {
  data: CampaignRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function CampaignTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("page")) params.set("page", "1");
    return params.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["campaigns", queryString],
    queryFn: () => apiGet<CampaignListResponse>(`/api/campaigns?${queryString}`),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/campaigns?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="h-9 rounded-md border border-neutral-200 px-3 text-sm"
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParam("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {CAMPAIGN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-neutral-200 px-3 text-sm"
          value={searchParams.get("channel") ?? ""}
          onChange={(event) => updateParam("channel", event.target.value)}
        >
          <option value="">All channels</option>
          {CAMPAIGN_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-neutral-200 px-3 text-sm"
          value={`${searchParams.get("sortBy") ?? "createdAt"}:${searchParams.get("sortOrder") ?? "desc"}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            const params = new URLSearchParams(searchParams.toString());
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);
            params.set("page", "1");
            router.push(`/campaigns?${params.toString()}`);
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="openRate:desc">Best open rate</option>
          <option value="conversionRate:desc">Best conversion</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {isLoading ? (
          <p className="p-8 text-sm text-neutral-500">Loading campaigns…</p>
        ) : error ? (
          <p className="p-8 text-sm text-rose-600">Failed to load campaigns.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Open</th>
                <th className="px-4 py-3">Click</th>
                <th className="px-4 py-3">Convert</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((campaign) => (
                <tr key={campaign.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{campaign.channel}</td>
                  <td className="px-4 py-3">{campaign.status}</td>
                  <td className="px-4 py-3">{campaign.segmentSize}</td>
                  <td className="px-4 py-3">{campaign.metrics.deliveryRate}%</td>
                  <td className="px-4 py-3">{campaign.metrics.openRate}%</td>
                  <td className="px-4 py-3">{campaign.metrics.clickRate}%</td>
                  <td className="px-4 py-3">
                    {campaign.metrics.conversionRate}%
                  </td>
                  <td className="px-4 py-3">
                    {new Date(campaign.createdAt).toLocaleDateString("en-IN")}
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
                router.push(`/campaigns?${params.toString()}`);
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
                router.push(`/campaigns?${params.toString()}`);
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
