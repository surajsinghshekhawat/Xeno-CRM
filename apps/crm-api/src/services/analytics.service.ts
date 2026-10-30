import type { CampaignChannel, CustomerTag, OrderChannel } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { daysSinceLastPurchase } from "./tag.service.js";
import {
  computeCampaignMetrics,
  computeMetricsFromStatusCounts,
  type RecipientStatusSlice,
} from "../utils/campaign-metrics.js";

const TAG_ORDER: CustomerTag[] = [
  "VIP",
  "REGULAR",
  "NEW",
  "AT_RISK",
  "LAPSED",
];

const HEALTHY_TAGS = new Set<CustomerTag>(["NEW", "REGULAR", "VIP"]);
const AT_RISK_TAGS = new Set<CustomerTag>(["AT_RISK", "LAPSED"]);

function bucketRecency(days: number | null): string {
  if (days === null) return "Never purchased";
  if (days <= 30) return "0–30 days";
  if (days <= 60) return "31–60 days";
  if (days <= 90) return "61–90 days";
  return "90+ days";
}

function weekKey(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

export async function getAnalyticsOverview() {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [
    customers,
    tagGroups,
    campaigns,
    recipientStatusCounts,
    orders,
    orderCount,
    campaignCount,
  ] = await Promise.all([
    prisma.customer.findMany({
      select: {
        tag: true,
        totalSpend: true,
        lastPurchaseAt: true,
        orderCount: true,
      },
    }),
    prisma.customer.groupBy({
      by: ["tag"],
      _count: { tag: true },
      _avg: { totalSpend: true },
      _sum: { totalSpend: true },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        channel: true,
        status: true,
        goal: true,
        segmentSize: true,
        createdAt: true,
        completedAt: true,
        recipients: { select: { status: true } },
      },
    }),
    prisma.campaignRecipient.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: eightWeeksAgo },
      },
      select: { totalValue: true, createdAt: true, channel: true },
    }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.campaign.count(),
  ]);

  const totalCustomers = customers.length;
  const tagMap = new Map(tagGroups.map((g) => [g.tag, g]));

  const customerHealth = TAG_ORDER.map((tag) => {
    const group = tagMap.get(tag);
    return {
      tag,
      count: group?._count.tag ?? 0,
      avgSpend: Math.round(group?._avg.totalSpend ?? 0),
      totalSpend: Math.round(group?._sum.totalSpend ?? 0),
      share:
        totalCustomers > 0
          ? Math.round(((group?._count.tag ?? 0) / totalCustomers) * 1000) / 10
          : 0,
    };
  });

  const recencyBuckets = new Map<string, number>();
  for (const customer of customers) {
    const days = daysSinceLastPurchase(customer.lastPurchaseAt);
    const bucket = bucketRecency(days);
    recencyBuckets.set(bucket, (recencyBuckets.get(bucket) ?? 0) + 1);
  }

  const recency = [
    "0–30 days",
    "31–60 days",
    "61–90 days",
    "90+ days",
    "Never purchased",
  ].map((bucket) => ({
    bucket,
    count: recencyBuckets.get(bucket) ?? 0,
  }));

  let healthyCount = 0;
  let atRiskCount = 0;
  for (const entry of customerHealth) {
    if (HEALTHY_TAGS.has(entry.tag)) healthyCount += entry.count;
    if (AT_RISK_TAGS.has(entry.tag)) atRiskCount += entry.count;
  }

  const globalFunnel = computeMetricsFromStatusCounts(recipientStatusCounts);

  const channelRollup = new Map<
    CampaignChannel,
    RecipientStatusSlice[]
  >();
  for (const campaign of campaigns) {
    const existing = channelRollup.get(campaign.channel) ?? [];
    channelRollup.set(campaign.channel, [
      ...existing,
      ...campaign.recipients,
    ]);
  }

  const channelPerformance = [...channelRollup.entries()].map(
    ([channel, recipients]) => {
      const metrics = computeCampaignMetrics(recipients);
      const campaignCountForChannel = campaigns.filter(
        (c) => c.channel === channel,
      ).length;
      return {
        channel,
        campaignCount: campaignCountForChannel,
        recipientCount: recipients.length,
        ...metrics,
      };
    },
  );

  const campaignPerformance = campaigns.map((campaign) => {
    const metrics = computeCampaignMetrics(campaign.recipients);
    return {
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      goal: campaign.goal,
      segmentSize: campaign.segmentSize,
      createdAt: campaign.createdAt.toISOString(),
      completedAt: campaign.completedAt?.toISOString() ?? null,
      metrics,
    };
  });

  const revenueByWeek = new Map<string, { revenue: number; orders: number }>();
  const revenueByChannel = new Map<OrderChannel, { revenue: number; orders: number }>();

  for (const order of orders) {
    const key = weekKey(order.createdAt);
    const week = revenueByWeek.get(key) ?? { revenue: 0, orders: 0 };
    week.revenue += order.totalValue;
    week.orders += 1;
    revenueByWeek.set(key, week);

    const channel = revenueByChannel.get(order.channel) ?? {
      revenue: 0,
      orders: 0,
    };
    channel.revenue += order.totalValue;
    channel.orders += 1;
    revenueByChannel.set(order.channel, channel);
  }

  const revenueTrend = [...revenueByWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

  const revenueByOrderChannel = [...revenueByChannel.entries()].map(
    ([channel, data]) => ({
      channel,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }),
  );

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalValue, 0);

  const revenueAgg = await prisma.order.aggregate({
    where: { status: "COMPLETED" },
    _sum: { totalValue: true },
    _avg: { totalValue: true },
  });

  return {
    summary: {
      totalCustomers,
      totalCampaigns: campaignCount,
      totalOrders: orderCount,
      totalRevenue: Math.round(revenueAgg._sum.totalValue ?? 0),
      avgOrderValue: Math.round(revenueAgg._avg.totalValue ?? 0),
      healthyCustomerPct:
        totalCustomers > 0
          ? Math.round((healthyCount / totalCustomers) * 1000) / 10
          : 0,
      atRiskCustomerPct:
        totalCustomers > 0
          ? Math.round((atRiskCount / totalCustomers) * 1000) / 10
          : 0,
      healthyCount,
      atRiskCount,
    },
    customerHealth,
    recency,
    globalFunnel,
    channelPerformance,
    campaignPerformance,
    revenueTrend,
    revenueByOrderChannel,
    recentPeriodRevenue: Math.round(totalRevenue),
  };
}
