import { prisma } from "../lib/prisma.js";
import { computeCampaignMetrics, computeMetricsFromStatusCounts } from "../utils/campaign-metrics.js";

export async function getDashboardStats() {
  const [
    totalCustomers,
    revenueAggregate,
    activeCampaigns,
    tagBreakdown,
    recentCampaigns,
    recipientStatusCounts,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalValue: true },
    }),
    prisma.campaign.count({
      where: { status: { in: ["SENDING", "ACTIVE"] } },
    }),
    prisma.customer.groupBy({
      by: ["tag"],
      _count: { tag: true },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        channel: true,
        status: true,
        createdAt: true,
        segmentSize: true,
        recipients: {
          select: { status: true },
        },
      },
    }),
    prisma.campaignRecipient.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const allMetrics = computeMetricsFromStatusCounts(recipientStatusCounts);
  const avgOpenRate = allMetrics.openRate;

  return {
    totalCustomers,
    totalRevenue: revenueAggregate._sum.totalValue ?? 0,
    activeCampaigns,
    avgOpenRate,
    customerHealth: tagBreakdown.map((entry) => ({
      tag: entry.tag,
      count: entry._count.tag,
    })),
    recentCampaigns: recentCampaigns.map((campaign) => {
      const metrics = computeCampaignMetrics(campaign.recipients);

      return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        createdAt: campaign.createdAt.toISOString(),
        segmentSize: campaign.segmentSize,
        openRate: metrics.openRate,
        keyMetric:
          metrics.counts.delivered > 0
            ? `${metrics.openRate}% open`
            : "—",
      };
    }),
  };
}
