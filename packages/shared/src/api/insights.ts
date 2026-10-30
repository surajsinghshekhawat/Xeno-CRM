import { z } from "zod";
import { segmentDefinitionSchema } from "../segment/schema.js";

export const insightTypeSchema = z.enum([
  "LAPSED_WINBACK",
  "VIP_LOYALTY",
  "HIGH_OPEN_FOLLOWUP",
  "NEW_WELCOME",
]);

export type InsightType = z.infer<typeof insightTypeSchema>;

export const insightCtaSchema = z.object({
  label: z.string(),
  action: z.literal("start_campaign"),
  context: z.object({
    goal: z.string(),
    suggestedChannel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]).optional(),
    segmentHint: z.string().optional(),
    segmentDefinition: segmentDefinitionSchema.optional(),
    priorCampaignId: z.string().uuid().optional(),
  }),
});

export const insightSchema = z.object({
  id: z.string(),
  type: insightTypeSchema,
  priority: z.number(),
  title: z.string(),
  message: z.string(),
  polishedMessage: z.string().optional(),
  cta: insightCtaSchema,
});

export const insightsResponseSchema = z.object({
  insight: insightSchema.nullable(),
  evaluatedAt: z.string(),
});

export type InsightCta = z.infer<typeof insightCtaSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;
