import { prisma } from "../lib/prisma.js";
import {
  aggregateCustomerMetrics,
  computeCustomerTag,
  getVipCustomerIds,
} from "./tag.service.js";

/** Recompute tags for a set of customers (single VIP pass). */
export async function refreshCustomerTags(customerIds: string[]): Promise<number> {
  if (customerIds.length === 0) return 0;

  const vipIds = await getVipCustomerIds(prisma);
  const uniqueIds = [...new Set(customerIds)];

  for (const id of uniqueIds) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: { totalValue: true, createdAt: true, status: true },
        },
      },
    });

    if (!customer) continue;

    const metrics = aggregateCustomerMetrics(customer.orders);
    const tag = computeCustomerTag(
      {
        orderCount: metrics.orderCount,
        lastPurchaseAt: metrics.lastPurchaseAt,
        totalSpend: metrics.totalSpend,
        orders: customer.orders,
      },
      { isVip: vipIds.has(id) },
    );

    await prisma.customer.update({
      where: { id },
      data: {
        tag,
        totalSpend: metrics.totalSpend,
        orderCount: metrics.orderCount,
        lastPurchaseAt: metrics.lastPurchaseAt,
      },
    });
  }

  return uniqueIds.length;
}

/** Recompute tags and denormalized metrics for one customer from their orders. */
export async function refreshCustomerTag(customerId: string): Promise<void> {
  await refreshCustomerTags([customerId]);
}

export async function refreshAllCustomerTags(): Promise<number> {
  const customers = await prisma.customer.findMany({
    select: { id: true },
  });

  return refreshCustomerTags(customers.map((c) => c.id));
}
