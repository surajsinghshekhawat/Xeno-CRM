import type { Customer, Order, Prisma } from "@prisma/client";

/** Days since a date relative to reference (default now). */
export function daysSince(
  date: Date | null,
  referenceDate: Date = new Date(),
): number | null {
  if (!date) return null;
  const ms = referenceDate.getTime() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Days since last purchase with no cutoff returns null when never purchased. */
export function daysSinceLastPurchase(lastPurchaseAt: Date | null): number | null {
  return daysSince(lastPurchaseAt);
}

export function getFirstPurchaseAt(
  customer: TagInput,
): Date | null {
  if (customer.orders?.length) {
    const completed = customer.orders.filter((o) => o.status === "COMPLETED");
    if (completed.length === 0) return null;
    return completed.reduce(
      (earliest, o) => (o.createdAt < earliest ? o.createdAt : earliest),
      completed[0]!.createdAt,
    );
  }

  if (customer.orderCount <= 1) {
    return customer.lastPurchaseAt;
  }

  return customer.firstPurchaseAt ?? null;
}

/** Spend in the recent window vs the prior window (declining if recent < 70% of prior). */
export function isSpendDeclining(
  orders: Pick<Order, "totalValue" | "createdAt" | "status">[],
  referenceDate: Date = new Date(),
): boolean {
  const completed = orders.filter((o) => o.status === "COMPLETED");
  if (completed.length < 2) return false;

  const recentCutoff = new Date(referenceDate);
  recentCutoff.setDate(recentCutoff.getDate() - 30);

  const priorCutoff = new Date(referenceDate);
  priorCutoff.setDate(priorCutoff.getDate() - 60);

  const recentSpend = completed
    .filter((o) => o.createdAt >= recentCutoff)
    .reduce((sum, o) => sum + o.totalValue, 0);

  const priorSpend = completed
    .filter((o) => o.createdAt >= priorCutoff && o.createdAt < recentCutoff)
    .reduce((sum, o) => sum + o.totalValue, 0);

  if (priorSpend <= 0) return false;
  return recentSpend < priorSpend * 0.7;
}

export type TagInput = Pick<
  Customer,
  "orderCount" | "lastPurchaseAt" | "totalSpend"
> & {
  firstPurchaseAt?: Date | null;
  orders?: Pick<Order, "totalValue" | "createdAt" | "status">[];
};

export type TagComputeOptions = {
  isVip?: boolean;
  referenceDate?: Date;
};

/**
 * Tag rules (approved thresholds):
 * - NEW: first purchase < 30 days OR only 1 order
 * - VIP: top 10% by total spend (passed via isVip)
 * - LAPSED: no purchase in 60+ days
 * - AT_RISK: 30–60 days since last purchase AND spend declining
 * - REGULAR: everything else
 */
export function computeCustomerTag(
  customer: TagInput,
  options: TagComputeOptions = {},
): "NEW" | "REGULAR" | "VIP" | "LAPSED" | "AT_RISK" {
  const referenceDate = options.referenceDate ?? new Date();
  const daysSinceLast = daysSince(customer.lastPurchaseAt, referenceDate);

  if (options.isVip) return "VIP";

  if (customer.orderCount <= 1) return "NEW";

  const firstPurchase = getFirstPurchaseAt(customer);
  const daysSinceFirst = daysSince(firstPurchase, referenceDate);
  if (daysSinceFirst !== null && daysSinceFirst < 30) return "NEW";

  if (daysSinceLast !== null && daysSinceLast >= 60) return "LAPSED";

  if (
    daysSinceLast !== null &&
    daysSinceLast >= 30 &&
    daysSinceLast < 60 &&
    customer.orders &&
    isSpendDeclining(customer.orders, referenceDate)
  ) {
    return "AT_RISK";
  }

  return "REGULAR";
}

export async function getVipCustomerIds(
  tx: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
): Promise<Set<string>> {
  const total = await tx.customer.count();
  if (total === 0) return new Set();

  const vipCount = Math.max(1, Math.ceil(total * 0.1));
  const topSpenders = await tx.customer.findMany({
    orderBy: { totalSpend: "desc" },
    take: vipCount,
    select: { id: true },
  });

  return new Set(topSpenders.map((c) => c.id));
}

export function aggregateCustomerMetrics(
  orders: Pick<Order, "totalValue" | "createdAt" | "status">[],
): {
  totalSpend: number;
  orderCount: number;
  lastPurchaseAt: Date | null;
  firstPurchaseAt: Date | null;
} {
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const orderCount = completed.length;
  const totalSpend = completed.reduce((sum, o) => sum + o.totalValue, 0);
  const lastPurchaseAt =
    completed.length > 0
      ? completed.reduce(
          (latest, o) => (o.createdAt > latest ? o.createdAt : latest),
          completed[0]!.createdAt,
        )
      : null;

  const firstPurchaseAt =
    completed.length > 0
      ? completed.reduce(
          (earliest, o) => (o.createdAt < earliest ? o.createdAt : earliest),
          completed[0]!.createdAt,
        )
      : null;

  return { totalSpend, orderCount, lastPurchaseAt, firstPurchaseAt };
}
