import { z } from "zod";
import {
  CAMPAIGN_CHANNELS,
  CUSTOMER_TAGS,
  ORDER_CHANNELS,
} from "../constants.js";

export const segmentFilterSchema = z
  .object({
    spendMin: z.number().nonnegative().optional(),
    spendMax: z.number().nonnegative().optional(),
    orderCountMin: z.number().int().nonnegative().optional(),
    orderCountMax: z.number().int().nonnegative().optional(),
    lastPurchaseBefore: z.string().datetime().optional(),
    lastPurchaseAfter: z.string().datetime().optional(),
    tags: z.array(z.enum(CUSTOMER_TAGS)).optional(),
    cities: z.array(z.string()).optional(),
    ageGroups: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    preferredChannels: z.array(z.enum(ORDER_CHANNELS)).optional(),
    hasPhone: z.boolean().optional(),
    hasEmail: z.boolean().optional(),
    customerCreatedAfter: z.string().datetime().optional(),
    excludeCampaignActivitySince: z.string().datetime().optional(),
    description: z.string().optional(),
  })
  .strict();

export type SegmentFilter = z.infer<typeof segmentFilterSchema>;

export const segmentDefinitionSchema = z.object({
  filters: segmentFilterSchema,
  description: z.string().optional(),
});

export type SegmentDefinition = z.infer<typeof segmentDefinitionSchema>;

export const segmentPreviewSchema = z.object({
  customers: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
      tag: z.enum(CUSTOMER_TAGS),
      totalSpend: z.number(),
      orderCount: z.number(),
      lastPurchaseAt: z.string().datetime().nullable(),
      city: z.string().nullable(),
    }),
  ),
  totalCount: z.number().int().nonnegative(),
  description: z.string().optional(),
});

export type SegmentPreview = z.infer<typeof segmentPreviewSchema>;

export const campaignDraftSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  segmentDefinition: segmentDefinitionSchema,
  segmentSize: z.number().int().positive(),
  messageTemplate: z.string().min(1),
  channel: z.enum(CAMPAIGN_CHANNELS),
});

export type CampaignDraft = z.infer<typeof campaignDraftSchema>;
