"use client";

import type { CustomerTag } from "@xeno/shared";
import { TagBadge } from "@/components/data/tag-badge";

export type RecipientRow = {
  id: string;
  customerName: string;
  customerTag: CustomerTag;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  convertedAt: string | null;
  personalizedMsg: string;
  failureReason: string | null;
};

function formatTs(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  QUEUED: "bg-neutral-100 text-neutral-700",
  SENT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  OPENED: "bg-violet-100 text-violet-800",
  CLICKED: "bg-amber-100 text-amber-900",
  CONVERTED: "bg-green-100 text-green-900",
};

export function RecipientTable({ recipients }: { recipients: RecipientRow[] }) {
  if (recipients.length === 0) {
    return (
      <p className="p-6 text-sm text-neutral-500">No recipients yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Tag</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sent</th>
            <th className="px-4 py-3">Opened</th>
            <th className="px-4 py-3">Clicked</th>
            <th className="px-4 py-3">Message</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => (
            <tr key={recipient.id} className="border-b border-neutral-100">
              <td className="px-4 py-3 font-medium">{recipient.customerName}</td>
              <td className="px-4 py-3">
                <TagBadge tag={recipient.customerTag} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[recipient.status] ?? "bg-neutral-100"}`}
                  title={recipient.failureReason ?? undefined}
                >
                  {recipient.status}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatTs(recipient.sentAt)}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatTs(recipient.openedAt)}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatTs(recipient.clickedAt)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-neutral-600">
                {recipient.personalizedMsg}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
