import type { RecipientStatus } from "@prisma/client";
import type {
  CampaignCompletedPayload,
  CampaignProgressPayload,
  RecipientUpdatePayload,
} from "@xeno/shared";
import { REALTIME_CLIENT_EVENTS, REALTIME_EVENTS } from "@xeno/shared";
import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { computeMetricsFromStatusCounts } from "../utils/campaign-metrics.js";
import { isTerminalStatus } from "./recipient-state-machine.js";

const CAMPAIGN_ROOM_PREFIX = "campaign:";

let io: Server | null = null;

export function campaignRoom(campaignId: string): string {
  return `${CAMPAIGN_ROOM_PREFIX}${campaignId}`;
}

export function initRealtime(server: Server): void {
  io = server;

  server.on("connection", (socket: Socket) => {
    socket.on(REALTIME_CLIENT_EVENTS.joinCampaign, (campaignId: unknown) => {
      if (typeof campaignId !== "string" || campaignId.length === 0) return;
      socket.join(campaignRoom(campaignId));
    });

    socket.on(REALTIME_CLIENT_EVENTS.leaveCampaign, (campaignId: unknown) => {
      if (typeof campaignId !== "string" || campaignId.length === 0) return;
      socket.leave(campaignRoom(campaignId));
    });
  });
}

export function getRealtimeServer(): Server | null {
  return io;
}

type StatusGroup = {
  status: RecipientStatus;
  _count: { status: number };
};

export function statusesToGroups(
  statuses: RecipientStatus[],
): StatusGroup[] {
  const counts = new Map<RecipientStatus, number>();
  for (const status of statuses) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({
    status,
    _count: { status: count },
  }));
}

export function buildCampaignProgress(
  campaignId: string,
  campaignStatus: import("@prisma/client").CampaignStatus,
  groups: StatusGroup[],
): CampaignProgressPayload {
  const metrics = computeMetricsFromStatusCounts(groups);
  const total = metrics.counts.total;
  let terminalCount = 0;

  for (const group of groups) {
    if (isTerminalStatus(group.status)) {
      terminalCount += group._count.status;
    }
  }

  const progressPercent =
    total === 0 ? 0 : Math.round((terminalCount / total) * 1000) / 10;

  return {
    campaignId,
    status: campaignStatus,
    progressPercent,
    terminalCount,
    total,
    metrics,
  };
}

function emitToCampaign<T>(campaignId: string, event: string, payload: T): void {
  if (!io) return;
  io.to(campaignRoom(campaignId)).emit(event, payload);
}

export function emitRecipientUpdate(input: {
  campaignId: string;
  recipientId: string;
  status: RecipientStatus;
  event: string;
  timestamp: string;
  duplicate: boolean;
}): void {
  const payload: RecipientUpdatePayload = {
    campaignId: input.campaignId,
    recipientId: input.recipientId,
    status: input.status,
    event: input.event,
    timestamp: input.timestamp,
    duplicate: input.duplicate,
  };

  emitToCampaign(input.campaignId, REALTIME_EVENTS.recipientUpdate, payload);
}

export async function emitCampaignProgressEvents(input: {
  campaignId: string;
  statuses: RecipientStatus[];
  campaignCompleted: boolean;
}): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    select: { status: true, completedAt: true },
  });

  if (!campaign) return;

  const groups = statusesToGroups(input.statuses);
  const progress = buildCampaignProgress(
    input.campaignId,
    campaign.status,
    groups,
  );

  emitToCampaign(
    input.campaignId,
    REALTIME_EVENTS.campaignProgress,
    progress,
  );

  if (input.campaignCompleted) {
    const completedPayload: CampaignCompletedPayload = {
      campaignId: input.campaignId,
      status: "COMPLETED",
      completedAt:
        campaign.completedAt?.toISOString() ?? new Date().toISOString(),
      metrics: progress.metrics,
    };

    emitToCampaign(
      input.campaignId,
      REALTIME_EVENTS.campaignCompleted,
      completedPayload,
    );
  }
}

/** @deprecated Use emitRecipientUpdate + emitCampaignProgressEvents */
export async function emitReceiptRealtimeUpdate(input: {
  campaignId: string;
  recipientId: string;
  status: RecipientStatus;
  event: string;
  timestamp: string;
  duplicate: boolean;
  campaignCompleted: boolean;
}): Promise<void> {
  emitRecipientUpdate(input);
  const statuses = await prisma.campaignRecipient.findMany({
    where: { campaignId: input.campaignId },
    select: { status: true },
  });
  await emitCampaignProgressEvents({
    campaignId: input.campaignId,
    statuses: statuses.map((row) => row.status),
    campaignCompleted: input.campaignCompleted,
  });
}
