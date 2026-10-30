import type { CampaignStatus, RecipientStatus } from "../constants.js";

export const REALTIME_EVENTS = {
  recipientUpdate: "recipient:update",
  campaignProgress: "campaign:progress",
  campaignCompleted: "campaign:completed",
} as const;

export const REALTIME_CLIENT_EVENTS = {
  joinCampaign: "campaign:join",
  leaveCampaign: "campaign:leave",
} as const;

export type CampaignMetricsSnapshot = {
  counts: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
  };
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  failedRate: number;
};

export type RecipientUpdatePayload = {
  campaignId: string;
  recipientId: string;
  status: RecipientStatus;
  event: string;
  timestamp: string;
  duplicate: boolean;
};

export type CampaignProgressPayload = {
  campaignId: string;
  status: CampaignStatus;
  progressPercent: number;
  terminalCount: number;
  total: number;
  metrics: CampaignMetricsSnapshot;
};

export type CampaignCompletedPayload = {
  campaignId: string;
  status: "COMPLETED";
  completedAt: string;
  metrics: CampaignMetricsSnapshot;
};
