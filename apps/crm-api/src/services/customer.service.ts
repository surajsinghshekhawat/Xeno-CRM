import type { Prisma } from "@prisma/client";
import { CUSTOMER_TAGS, type CustomerListQuery } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";

function parseTagList(tags?: string) {
  if (!tags) return undefined;
  const list = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag): tag is (typeof CUSTOMER_TAGS)[number] =>
      (CUSTOMER_TAGS as readonly string[]).includes(tag),
    );
  return list.length > 0 ? list : undefined;
}

function serializeCustomer<T extends {
  lastPurchaseAt: Date | null;
  createdAt: Date;
  totalSpend: number;
}>(customer: T) {
  return {
    ...customer,
    lastPurchaseAt: customer.lastPurchaseAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
  };
}

export async function listCustomers(query: CustomerListQuery) {
  const where: Prisma.CustomerWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.tags) {
    const tagList = parseTagList(query.tags);
    if (tagList?.length) {
      where.tag = { in: tagList };
    }
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const skip = (query.page - 1) * query.pageSize;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tag: true,
        totalSpend: true,
        orderCount: true,
        lastPurchaseAt: true,
        city: true,
        ageGroup: true,
        gender: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    data: customers.map(serializeCustomer),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          items: true,
          totalValue: true,
          channel: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) return null;

  return {
    ...serializeCustomer(customer),
    orders: customer.orders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
