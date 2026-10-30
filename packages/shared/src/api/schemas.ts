import { z } from "zod";
import {
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  CUSTOMER_TAGS,
  ORDER_CHANNELS,
  ORDER_STATUSES,
} from "../constants.js";
import { segmentDefinitionSchema } from "../segment/schema.js";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const customerListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  sortBy: z
    .enum(["name", "totalSpend", "orderCount", "lastPurchaseAt", "createdAt"])
    .default("totalSpend"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema> & {
  tagList?: (typeof CUSTOMER_TAGS)[number][];
};

export const orderListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  channel: z.enum(ORDER_CHANNELS).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  sortBy: z.enum(["createdAt", "totalValue"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const csvImportRequestSchema = z.object({
  csv: z.string().min(1),
  mode: z.enum(["preview", "import"]).default("preview"),
});

export type CsvImportRequest = z.infer<typeof csvImportRequestSchema>;

export const csvRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export const campaignListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  channel: z.enum(CAMPAIGN_CHANNELS).optional(),
  sortBy: z
    .enum(["createdAt", "deliveryRate", "openRate", "clickRate", "conversionRate"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  segmentDefinition: segmentDefinitionSchema,
  segmentSize: z.number().int().positive(),
  messageTemplate: z.string().min(1),
  channel: z.enum(CAMPAIGN_CHANNELS),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
