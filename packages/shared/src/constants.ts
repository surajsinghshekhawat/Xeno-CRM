export const CUSTOMER_TAGS = [
  "NEW",
  "REGULAR",
  "VIP",
  "LAPSED",
  "AT_RISK",
] as const;

export type CustomerTag = (typeof CUSTOMER_TAGS)[number];

export const ORDER_CHANNELS = ["ONLINE", "IN_STORE", "APP"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const ORDER_STATUSES = ["COMPLETED", "RETURNED", "PENDING"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CAMPAIGN_CHANNELS = ["WHATSAPP", "SMS", "EMAIL", "RCS"] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SENDING",
  "ACTIVE",
  "COMPLETED",
  "FAILED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const RECIPIENT_STATUSES = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "OPENED",
  "CLICKED",
  "CONVERTED",
] as const;
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

/** Default service ports for local development */
export const PORTS = {
  web: 3000,
  crmApi: 3001,
  channelStub: 3002,
} as const;
