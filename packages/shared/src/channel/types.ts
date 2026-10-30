import { z } from "zod";
import { CAMPAIGN_CHANNELS } from "../constants.js";

export const channelSendRecipientSchema = z.object({
  recipientId: z.string().uuid(),
  customerId: z.string().uuid(),
  phone: z.string().nullable().optional(),
  email: z.string().email(),
  message: z.string().min(1),
  channel: z.enum(CAMPAIGN_CHANNELS),
});

export const channelSendRequestSchema = z.object({
  campaignId: z.string().uuid(),
  recipients: z.array(channelSendRecipientSchema).min(1),
});

export const channelSendResponseSchema = z.object({
  accepted: z.literal(true),
  jobId: z.string().uuid(),
});

export type ChannelSendRecipient = z.infer<typeof channelSendRecipientSchema>;
export type ChannelSendRequest = z.infer<typeof channelSendRequestSchema>;
export type ChannelSendResponse = z.infer<typeof channelSendResponseSchema>;
