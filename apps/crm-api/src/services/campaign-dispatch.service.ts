import type { CampaignChannel } from "@prisma/client";
import type { ChannelSendRequest } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import {  ChannelStubError,
  sendCampaignToStub,
} from "../clients/channel-stub.client.js";
import { personalizeMessage } from "./personalization.service.js";

export type DispatchResult =
  | { success: true; jobId: string }
  | { success: false; message: string };

export async function buildStubPayload(campaignId: string): Promise<ChannelSendRequest> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      recipients: {
        where: { status: "QUEUED" },
        include: {
          customer: {
            select: { phone: true, email: true },
          },
        },
      },
    },
  });

  if (campaign.recipients.length === 0) {
    throw new ChannelStubError("No queued recipients to dispatch");
  }

  return {
    campaignId: campaign.id,
    recipients: campaign.recipients.map((recipient) => ({
      recipientId: recipient.id,
      customerId: recipient.customerId,
      phone: recipient.customer.phone,
      email: recipient.customer.email,
      message: recipient.personalizedMsg,
      channel: campaign.channel,
    })),
  };
}

export async function dispatchCampaignToChannelStub(
  campaignId: string,
): Promise<DispatchResult> {
  try {
    const payload = await buildStubPayload(campaignId);
    const result = await sendCampaignToStub(payload);

    const sentAt = new Date();
    await prisma.campaignRecipient.updateMany({
      where: { campaignId, status: "QUEUED" },
      data: { status: "SENT", sentAt },
    });

    return { success: true, jobId: result.jobId };
  } catch (error) {
    const message =
      error instanceof ChannelStubError
        ? error.message
        : "Channel service is currently unavailable. Will retry.";

    return { success: false, message };
  }
}

export async function retryCampaignDispatch(campaignId: string): Promise<DispatchResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  if (!campaign) {
    throw new AppError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  if (campaign.status !== "SENDING") {
    throw new AppError(
      400,
      "Retry dispatch is only available for SENDING campaigns",
      "INVALID_CAMPAIGN_STATUS",
    );
  }

  const queuedCount = await prisma.campaignRecipient.count({
    where: { campaignId, status: "QUEUED" },
  });

  if (queuedCount === 0) {
    throw new AppError(
      400,
      "No queued recipients remain to dispatch",
      "NO_QUEUED_RECIPIENTS",
    );
  }

  return dispatchCampaignToChannelStub(campaignId);
}

export { personalizeMessage };
