import type { Insight } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";
import { computeCampaignMetrics } from "../utils/campaign-metrics.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const INSIGHT_PRIORITY = {
  LAPSED_WINBACK: 100,
  VIP_LOYALTY: 90,
  HIGH_OPEN_FOLLOWUP: 80,
  NEW_WELCOME: 70,
} as const;

export function pickPrimaryInsight(candidates: Insight[]): Insight | null {
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.priority - a.priority)[0] ?? null;
}

export function daysAgo(days: number, reference = new Date()): Date {
  return new Date(reference.getTime() - days * DAY_MS);
}

async function evaluateLapsedWinback(): Promise<Insight | null> {
  const lapsedCount = await prisma.customer.count({
    where: { tag: "LAPSED" },
  });

  if (lapsedCount <= 50) return null;

  return {
    id: "lapsed-winback",
    type: "LAPSED_WINBACK",
    priority: INSIGHT_PRIORITY.LAPSED_WINBACK,
    title: "Win back lapsed customers",
    message: `${lapsedCount} lapsed customers haven't purchased in 60+ days. A targeted WhatsApp offer could re-engage them.`,
    cta: {
      label: "Start win-back campaign",
      action: "start_campaign",
      context: {
        goal: "Win back lapsed customers with a limited-time offer",
        suggestedChannel: "WHATSAPP",
        segmentHint: "Customers tagged LAPSED",
        segmentDefinition: {
          filters: { tags: ["LAPSED"] },
          description: "Customers tagged LAPSED",
        },
      },
    },
  };
}

async function evaluateVipLoyalty(): Promise<Insight | null> {
  const cutoff = daysAgo(30);
  const untouchedVipCount = await prisma.customer.count({
    where: {
      tag: "VIP",
      campaignRecipients: {
        none: {
          OR: [
            { sentAt: { gte: cutoff } },
            { campaign: { createdAt: { gte: cutoff } } },
          ],
        },
      },
    },
  });

  if (untouchedVipCount === 0) return null;

  return {
    id: "vip-loyalty",
    type: "VIP_LOYALTY",
    priority: INSIGHT_PRIORITY.VIP_LOYALTY,
    title: "Reconnect with VIP customers",
    message: `${untouchedVipCount} VIP customers haven't received a campaign in 30+ days. Send a loyalty appreciation message.`,
    cta: {
      label: "Start VIP campaign",
      action: "start_campaign",
      context: {
        goal: "Reward VIP customers with an exclusive loyalty message",
        suggestedChannel: "WHATSAPP",
        segmentHint: "VIP customers not recently campaigned",
        segmentDefinition: {
          filters: {
            tags: ["VIP"],
            excludeCampaignActivitySince: cutoff.toISOString(),
          },
          description: "VIP customers with no campaign activity in 30+ days",
        },
      },
    },
  };
}

async function evaluateHighOpenFollowup(): Promise<Insight | null> {
  const lastCampaign = await prisma.campaign.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    include: {
      recipients: { select: { status: true } },
    },
  });

  if (!lastCampaign) return null;

  const metrics = computeCampaignMetrics(lastCampaign.recipients);
  if (metrics.openRate <= 40) return null;

  return {
    id: "high-open-followup",
    type: "HIGH_OPEN_FOLLOWUP",
    priority: INSIGHT_PRIORITY.HIGH_OPEN_FOLLOWUP,
    title: "Follow up on strong engagement",
    message: `"${lastCampaign.name}" achieved a ${metrics.openRate}% open rate. Follow up with non-openers while momentum is high.`,
    cta: {
      label: "Plan follow-up campaign",
      action: "start_campaign",
      context: {
        goal: `Follow up on ${lastCampaign.name} with non-openers`,
        suggestedChannel: lastCampaign.channel,
        segmentHint: "Recipients who did not open the last campaign",
        priorCampaignId: lastCampaign.id,
      },
    },
  };
}

async function evaluateNewWelcome(): Promise<Insight | null> {
  const cutoff = daysAgo(7);
  const newCount = await prisma.customer.count({
    where: {
      tag: "NEW",
      createdAt: { gte: cutoff },
    },
  });

  if (newCount <= 20) return null;

  return {
    id: "new-welcome",
    type: "NEW_WELCOME",
    priority: INSIGHT_PRIORITY.NEW_WELCOME,
    title: "Welcome new customers",
    message: `${newCount} new customers joined in the last 7 days. A welcome campaign can drive a strong first repeat purchase.`,
    cta: {
      label: "Start welcome campaign",
      action: "start_campaign",
      context: {
        goal: "Welcome new customers and encourage a second purchase",
        suggestedChannel: "EMAIL",
        segmentHint: "Customers tagged NEW, joined in last 7 days",
        segmentDefinition: {
          filters: {
            tags: ["NEW"],
            customerCreatedAfter: cutoff.toISOString(),
          },
          description: "New customers who joined in the last 7 days",
        },
      },
    },
  };
}

export async function evaluateInsights(): Promise<Insight[]> {
  const [lapsed, vip, openRate, welcome] = await Promise.all([
    evaluateLapsedWinback(),
    evaluateVipLoyalty(),
    evaluateHighOpenFollowup(),
    evaluateNewWelcome(),
  ]);

  return [lapsed, vip, openRate, welcome].filter(
    (insight): insight is Insight => insight !== null,
  );
}

export async function getPrimaryInsight(): Promise<{
  insight: Insight | null;
  evaluatedAt: string;
}> {
  const candidates = await evaluateInsights();
  const primary = pickPrimaryInsight(candidates);
  return {
    insight: primary,
    evaluatedAt: new Date().toISOString(),
  };
}
