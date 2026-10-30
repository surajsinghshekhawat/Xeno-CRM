import type { Prisma } from "@prisma/client";
import type { OrderListQuery } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";

export async function listOrders(query: OrderListQuery) {
  const where: Prisma.OrderWhereInput = {};

  if (query.channel) {
    where.channel = query.channel;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.customer = {
      name: { contains: query.search, mode: "insensitive" },
    };
  }

  const orderBy: Prisma.OrderOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const skip = (query.page - 1) * query.pageSize;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      select: {
        id: true,
        customerId: true,
        items: true,
        totalValue: true,
        channel: true,
        status: true,
        createdAt: true,
        customer: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  return {
    data: orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      items: order.items,
      totalValue: order.totalValue,
      channel: order.channel,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}
