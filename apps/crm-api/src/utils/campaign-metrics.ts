import type { RecipientStatus } from "@prisma/client";

const OPEN_STATUSES = new Set<RecipientStatus>([
  "OPENED",
  "CLICKED",
  "CONVERTED",
]);
const DELIVERED_STATUSES = new Set<RecipientStatus>([
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "CONVERTED",
]);
const CLICK_STATUSES = new Set<RecipientStatus>(["CLICKED", "CONVERTED"]);
const CONVERT_STATUSES = new Set<RecipientStatus>(["CONVERTED"]);
const SENT_STATUSES = new Set<RecipientStatus>([
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "CONVERTED",
  "FAILED",
]);

export function recipientRate(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export function computeCampaignMetrics(recipients: RecipientStatusSlice[]) {
  const total = recipients.length;
  const sent = recipients.filter((r) => SENT_STATUSES.has(r.status)).length;
  const delivered = recipients.filter((r) =>
    DELIVERED_STATUSES.has(r.status),
  ).length;
  const opened = recipients.filter((r) => OPEN_STATUSES.has(r.status)).length;
  const clicked = recipients.filter((r) => CLICK_STATUSES.has(r.status)).length;
  const converted = recipients.filter((r) =>
    CONVERT_STATUSES.has(r.status),
  ).length;
  const failed = recipients.filter((r) => r.status === "FAILED").length;

  return {
    counts: { total, sent, delivered, opened, clicked, converted, failed },
    deliveryRate: recipientRate(delivered, total),
    openRate: recipientRate(opened, delivered),
    clickRate: recipientRate(clicked, opened),
    conversionRate: recipientRate(converted, clicked),
    failedRate: recipientRate(failed, total),
  };
}

export type RecipientStatusSlice = { status: RecipientStatus };

export function computeMetricsFromStatusCounts(
  groups: { status: RecipientStatus; _count: { status: number } }[],
) {
  let total = 0;
  let sent = 0;
  let delivered = 0;
  let opened = 0;
  let clicked = 0;
  let converted = 0;
  let failed = 0;

  for (const group of groups) {
    const count = group._count.status;
    total += count;
    if (SENT_STATUSES.has(group.status)) sent += count;
    if (DELIVERED_STATUSES.has(group.status)) delivered += count;
    if (OPEN_STATUSES.has(group.status)) opened += count;
    if (CLICK_STATUSES.has(group.status)) clicked += count;
    if (CONVERT_STATUSES.has(group.status)) converted += count;
    if (group.status === "FAILED") failed += count;
  }

  return {
    counts: { total, sent, delivered, opened, clicked, converted, failed },
    deliveryRate: recipientRate(delivered, total),
    openRate: recipientRate(opened, delivered),
    clickRate: recipientRate(clicked, opened),
    conversionRate: recipientRate(converted, clicked),
    failedRate: recipientRate(failed, total),
  };
}
