import type { Prisma, RecipientStatus } from "@prisma/client";
import type { CampaignListQuery, CreateCampaignInput, SegmentDefinition } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import {
  dispatchCampaignToChannelStub,
  personalizeMessage,
  retryCampaignDispatch,
} from "./campaign-dispatch.service.js";
import { getCustomerIdsForSegment } from "./segment.service.js";
import { computeCampaignMetrics } from "../utils/campaign-metrics.js";

function serializeCampaign<T extends { createdAt: Date; completedAt: Date | null }>(
  campaign: T,
) {
  return {
    ...campaign,
    createdAt: campaign.createdAt.toISOString(),
    completedAt: campaign.completedAt?.toISOString() ?? null,
  };
}

function segmentDescription(segmentDefinition: unknown): string {
  const def = segmentDefinition as SegmentDefinition;
  return def.description ?? "Custom segment";
}

export async function listCampaigns(query: CampaignListQuery) {
  const where: Prisma.CampaignWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.channel) where.channel = query.channel;

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      recipients: { select: { status: true } },
    },
  });

  const enriched = campaigns.map((campaign) => {
    const metrics = computeCampaignMetrics(campaign.recipients);
    return {
      ...serializeCampaign(campaign),
      segmentDescription: segmentDescription(campaign.segmentDefinition),
      metrics: {
        deliveryRate: metrics.deliveryRate,
        openRate: metrics.openRate,
        clickRate: metrics.clickRate,
        conversionRate: metrics.conversionRate,
      },
    };
  });

  const sorted = [...enriched].sort((a, b) => {
    if (query.sortBy === "createdAt") {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return query.sortOrder === "asc" ? diff : -diff;
    }

    const aValue = a.metrics[query.sortBy];
    const bValue = b.metrics[query.sortBy];
    return query.sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const total = sorted.length;
  const skip = (query.page - 1) * query.pageSize;
  const data = sorted.slice(skip, skip + query.pageSize);

  return {
    data,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getCampaignById(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      recipients: {
        include: {
          customer: {
            select: { id: true, name: true, email: true, tag: true },
          },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!campaign) return null;

  const metrics = computeCampaignMetrics(campaign.recipients);

  return {
    ...serializeCampaign(campaign),
    segmentDescription: segmentDescription(campaign.segmentDefinition),
    metrics: {
      ...metrics.counts,
      deliveryRate: metrics.deliveryRate,
      openRate: metrics.openRate,
      clickRate: metrics.clickRate,
      conversionRate: metrics.conversionRate,
      failedRate: metrics.failedRate,
    },
    recipients: campaign.recipients.map((recipient) => ({
      id: recipient.id,
      customerId: recipient.customerId,
      customerName: recipient.customer.name,
      customerEmail: recipient.customer.email,
      customerTag: recipient.customer.tag,
      status: recipient.status,
      personalizedMsg: recipient.personalizedMsg,
      sentAt: recipient.sentAt?.toISOString() ?? null,
      deliveredAt: recipient.deliveredAt?.toISOString() ?? null,
      openedAt: recipient.openedAt?.toISOString() ?? null,
      clickedAt: recipient.clickedAt?.toISOString() ?? null,
      convertedAt: recipient.convertedAt?.toISOString() ?? null,
      failureReason: recipient.failureReason,
    })),
  };
}

export async function createCampaign(input: CreateCampaignInput) {
  const campaign = await prisma.campaign.create({
    data: {
      name: input.name,
      goal: input.goal,
      segmentDefinition: input.segmentDefinition,
      segmentSize: input.segmentSize,
      messageTemplate: input.messageTemplate,
      channel: input.channel,
      status: "DRAFT",
    },
  });

  return serializeCampaign(campaign);
}

export async function launchCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new AppError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  if (campaign.status !== "DRAFT") {
    throw new AppError(
      400,
      `Campaign cannot be launched from status ${campaign.status}`,
      "INVALID_CAMPAIGN_STATUS",
    );
  }

  const segmentDefinition = campaign.segmentDefinition as SegmentDefinition;
  const customerIds = await getCustomerIdsForSegment(segmentDefinition.filters);

  if (customerIds.length === 0) {
    throw new AppError(
      400,
      "Segment matched zero customers",
      "EMPTY_SEGMENT",
    );
  }

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, tag: true, phone: true, email: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.campaignRecipient.createMany({
      data: customers.map((customer) => ({
        campaignId: campaign.id,
        customerId: customer.id,
        personalizedMsg: personalizeMessage(campaign.messageTemplate, {
          name: customer.name,
          tag: customer.tag,
        }),
        status: "QUEUED" satisfies RecipientStatus,
      })),
    });

    await tx.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        segmentSize: customers.length,
      },
    });
  });

  const dispatch = await dispatchCampaignToChannelStub(campaign.id);
  const updated = await getCampaignById(campaign.id);

  return {
    ...updated!,
    dispatch,
  };
}

export async function retryCampaignLaunch(campaignId: string) {
  const dispatch = await retryCampaignDispatch(campaignId);
  const updated = await getCampaignById(campaignId);
  return {
    ...updated!,
    dispatch,
  };
}
