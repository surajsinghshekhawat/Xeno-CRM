"use client";

import type { CustomerTag } from "@xeno/shared";
import { TagBadge } from "@/components/data/tag-badge";
import { BRAND } from "@xeno/shared";

export type SegmentPreviewData = {
  customers: {
    id: string;
    name: string;
    email: string;
    tag: CustomerTag;
    totalSpend: number;
    orderCount: number;
    city: string | null;
  }[];
  totalCount: number;
  description?: string;
};

export function SegmentPreview({ data }: { data: SegmentPreviewData | null }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
        Segment preview will appear when the AI queries your audience.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h3 className="font-medium">Segment preview</h3>
        <p className="text-xs text-neutral-500">
          {data.totalCount.toLocaleString("en-IN")} customers
          {data.description ? ` · ${data.description}` : ""}
        </p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Tag</th>
            <th className="px-4 py-2">Spend</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.map((customer) => (
            <tr key={customer.id} className="border-t border-neutral-100">
              <td className="px-4 py-2">{customer.name}</td>
              <td className="px-4 py-2">
                <TagBadge tag={customer.tag} />
              </td>
              <td className="px-4 py-2">
                {BRAND.currencySymbol}
                {customer.totalSpend.toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
