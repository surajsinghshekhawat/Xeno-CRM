import type { Prisma } from "@prisma/client";
import {
  segmentFilterSchema,
  type SegmentFilter,
  type SegmentPreview,
} from "@xeno/shared";
import { prisma } from "../lib/prisma.js";

const PREVIEW_LIMIT = 5;

function buildWhereClause(filters: SegmentFilter): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.spendMin !== undefined || filters.spendMax !== undefined) {
    where.totalSpend = {
      ...(filters.spendMin !== undefined ? { gte: filters.spendMin } : {}),
      ...(filters.spendMax !== undefined ? { lte: filters.spendMax } : {}),
    };
  }

  if (filters.orderCountMin !== undefined || filters.orderCountMax !== undefined) {
    where.orderCount = {
      ...(filters.orderCountMin !== undefined ? { gte: filters.orderCountMin } : {}),
      ...(filters.orderCountMax !== undefined ? { lte: filters.orderCountMax } : {}),
    };
  }

  if (filters.lastPurchaseBefore) {
    where.lastPurchaseAt = {
      ...(where.lastPurchaseAt as Prisma.DateTimeNullableFilter | undefined),
      lte: new Date(filters.lastPurchaseBefore),
    };
  }

  if (filters.lastPurchaseAfter) {
    where.lastPurchaseAt = {
      ...(where.lastPurchaseAt as Prisma.DateTimeNullableFilter | undefined),
      gte: new Date(filters.lastPurchaseAfter),
    };
  }

  if (filters.tags?.length) {
    where.tag = { in: filters.tags };
  }

  if (filters.cities?.length) {
    where.city = { in: filters.cities };
  }

  if (filters.ageGroups?.length) {
    where.ageGroup = { in: filters.ageGroups };
  }

  if (filters.genders?.length) {
    where.gender = { in: filters.genders };
  }

  if (filters.hasPhone === true) {
    where.phone = { not: null };
  } else if (filters.hasPhone === false) {
    where.phone = null;
  }

  if (filters.hasEmail === true) {
    where.email = { not: "" };
  }

  if (filters.customerCreatedAfter) {
    where.createdAt = {
      gte: new Date(filters.customerCreatedAfter),
    };
  }

  if (filters.excludeCampaignActivitySince) {
    const since = new Date(filters.excludeCampaignActivitySince);
    where.campaignRecipients = {
      none: {
        OR: [
          { sentAt: { gte: since } },
          { campaign: { createdAt: { gte: since } } },
        ],
      },
    };
  }

  if (filters.preferredChannels?.length) {
    where.orders = {
      some: {
        channel: { in: filters.preferredChannels },
        status: "COMPLETED",
      },
    };
  }

  return where;
}

export function parseSegmentFilters(input: unknown): SegmentFilter {
  return segmentFilterSchema.parse(input);
}

export async function getCustomerSegment(
  filtersInput: unknown,
  options: { limit?: number; description?: string } = {},
): Promise<SegmentPreview> {
  const filters = parseSegmentFilters(filtersInput);
  const where = buildWhereClause(filters);

  const [totalCount, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { totalSpend: "desc" },
      take: options.limit ?? PREVIEW_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        tag: true,
        totalSpend: true,
        orderCount: true,
        lastPurchaseAt: true,
        city: true,
      },
    }),
  ]);

  return {
    customers: customers.map((c) => ({
      ...c,
      lastPurchaseAt: c.lastPurchaseAt?.toISOString() ?? null,
    })),
    totalCount,
    description: options.description ?? filters.description,
  };
}

export async function getCustomerIdsForSegment(
  filtersInput: unknown,
): Promise<string[]> {
  const filters = parseSegmentFilters(filtersInput);
  const where = buildWhereClause(filters);

  const rows = await prisma.customer.findMany({
    where,
    select: { id: true },
  });

  return rows.map((r) => r.id);
}

/** Convenience helper for churn-risk style queries used by AI tools. */
export async function getChurnRiskCustomers(
  daysSinceLastPurchase: number,
  minSpend?: number,
): Promise<SegmentPreview> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceLastPurchase);

  return getCustomerSegment(
    {
      lastPurchaseBefore: cutoff.toISOString(),
      ...(minSpend !== undefined ? { spendMin: minSpend } : {}),
      tags: ["AT_RISK", "LAPSED"],
    },
    {
      description: `Customers with no purchase in ${daysSinceLastPurchase}+ days${minSpend ? ` and spend ≥ ₹${minSpend}` : ""}`,
    },
  );
}

export async function getTopSpenders(
  limit: number,
  daysSinceLastPurchase?: number,
): Promise<SegmentPreview> {
  const filters: SegmentFilter = {};

  if (daysSinceLastPurchase !== undefined) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSinceLastPurchase);
    filters.lastPurchaseAfter = cutoff.toISOString();
  }

  return getCustomerSegment(filters, {
    limit,
    description: `Top ${limit} customers by spend`,
  });
}
