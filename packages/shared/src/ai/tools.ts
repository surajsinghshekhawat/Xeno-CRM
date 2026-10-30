import { z } from "zod";
import { CAMPAIGN_CHANNELS } from "../constants.js";
import { segmentFilterSchema } from "../segment/schema.js";

export const AI_TOOL_NAMES = [
  "getCustomerSegment",
  "getCampaignStats",
  "getCustomerProfile",
  "getChurnRiskCustomers",
  "getTopSpenders",
  "fireCampaign",
] as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[number];

export const getCustomerSegmentInputSchema = z.object({
  filters: segmentFilterSchema,
  description: z.string().optional(),
  limit: z.number().int().positive().max(20).optional(),
});

export const getCampaignStatsInputSchema = z.object({
  campaignId: z.string().uuid().optional(),
});

export const getCustomerProfileInputSchema = z.object({
  customerId: z.string().uuid(),
});

export const getChurnRiskCustomersInputSchema = z.object({
  daysSinceLastPurchase: z.number().int().positive(),
  minSpend: z.number().nonnegative().optional(),
});

export const getTopSpendersInputSchema = z.object({
  limit: z.number().int().positive().max(50).default(10),
  daysSinceLastPurchase: z.number().int().positive().optional(),
});

export const fireCampaignInputSchema = z.object({
  segmentFilters: segmentFilterSchema,
  message: z.string().min(1),
  channel: z.enum(CAMPAIGN_CHANNELS),
  campaignName: z.string().min(1),
  goal: z.string().min(1).optional(),
  confirmed: z.boolean().default(false),
});

export type GetCustomerSegmentInput = z.infer<typeof getCustomerSegmentInputSchema>;
export type GetCampaignStatsInput = z.infer<typeof getCampaignStatsInputSchema>;
export type GetCustomerProfileInput = z.infer<typeof getCustomerProfileInputSchema>;
export type GetChurnRiskCustomersInput = z.infer<
  typeof getChurnRiskCustomersInputSchema
>;
export type GetTopSpendersInput = z.infer<typeof getTopSpendersInputSchema>;
export type FireCampaignInput = z.infer<typeof fireCampaignInputSchema>;

export const aiToolSchemas = {
  getCustomerSegment: getCustomerSegmentInputSchema,
  getCampaignStats: getCampaignStatsInputSchema,
  getCustomerProfile: getCustomerProfileInputSchema,
  getChurnRiskCustomers: getChurnRiskCustomersInputSchema,
  getTopSpenders: getTopSpendersInputSchema,
  fireCampaign: fireCampaignInputSchema,
} as const;
