import type { Prisma, RecipientStatus } from "@prisma/client";
import type { ReceiptPayload } from "@xeno/shared";
import { generatePostCampaignSummary } from "../ai/post-campaign-summary.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import {
  emitCampaignProgressEvents,
  emitRecipientUpdate,
} from "./realtime.service.js";
import {
  canTransition,
  eventToStatus,
  isDuplicateEvent,
  isTerminalStatus,
  timestampFieldForEvent,
} from "./recipient-state-machine.js";

export type ReceiptResult = {
  ok: true;
  duplicate: boolean;
  recipientId: string;
  status: string;
  campaignCompleted: boolean;
};

async function triggerPostCampaignSummary(campaignId: string): Promise<void> {
  void generatePostCampaignSummary(campaignId);
}

export async function finalizeCampaignIfComplete(
  campaignId: string,
  statuses: RecipientStatus[],
): Promise<boolean> {
  if (statuses.length === 0) return false;

  const allTerminal = statuses.every((status) => isTerminalStatus(status));
  if (!allTerminal) return false;

  const hasInFlight = statuses.some(
    (status) => status === "QUEUED" || status === "SENT",
  );
  if (hasInFlight) return false;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  void triggerPostCampaignSummary(campaignId);
  return true;
}

export async function processReceipt(
  payload: ReceiptPayload,
): Promise<ReceiptResult> {
  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: payload.recipientId },
  });

  if (!recipient) {
    throw new AppError(404, "Recipient not found", "RECIPIENT_NOT_FOUND");
  }

  if (recipient.campaignId !== payload.campaignId) {
    throw new AppError(400, "Campaign mismatch", "CAMPAIGN_MISMATCH");
  }

  if (isDuplicateEvent(recipient.status, payload.event)) {
    return {
      ok: true,
      duplicate: true,
      recipientId: recipient.id,
      status: recipient.status,
      campaignCompleted: false,
    };
  }

  const nextStatus = eventToStatus(payload.event);

  if (!canTransition(recipient.status, nextStatus)) {
    throw new AppError(
      400,
      `Invalid transition ${recipient.status} → ${nextStatus}`,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const eventTime = new Date(payload.timestamp);
  const data: Prisma.CampaignRecipientUpdateInput = {
    status: nextStatus,
  };

  const tsField = timestampFieldForEvent(payload.event);
  if (tsField) {
    data[tsField] = eventTime;
  }

  if (payload.event === "failed" && payload.failureReason) {
    data.failureReason = payload.failureReason;
  }

  if (payload.event === "delivered" && recipient.status === "FAILED") {
    data.failureReason = null;
  }

  await prisma.campaignRecipient.update({
    where: { id: recipient.id },
    data,
  });

  emitRecipientUpdate({
    campaignId: payload.campaignId,
    recipientId: recipient.id,
    status: nextStatus,
    event: payload.event,
    timestamp: payload.timestamp,
    duplicate: false,
  });

  const recipientRows = await prisma.campaignRecipient.findMany({
    where: { campaignId: payload.campaignId },
    select: { status: true },
  });
  const statuses = recipientRows.map((row) => row.status);

  const campaignCompleted = await finalizeCampaignIfComplete(
    payload.campaignId,
    statuses,
  );

  await emitCampaignProgressEvents({
    campaignId: payload.campaignId,
    statuses,
    campaignCompleted,
  });

  return {
    ok: true,
    duplicate: false,
    recipientId: recipient.id,
    status: nextStatus,
    campaignCompleted,
  };
}
