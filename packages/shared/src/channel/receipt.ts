import { z } from "zod";

export const receiptEventSchema = z.enum([
  "delivered",
  "failed",
  "opened",
  "clicked",
  "converted",
]);

export const receiptPayloadSchema = z.object({
  recipientId: z.string().uuid(),
  campaignId: z.string().uuid(),
  customerId: z.string().uuid(),
  event: receiptEventSchema,
  timestamp: z.string().datetime(),
  failureReason: z.string().optional(),
});

export type ReceiptEvent = z.infer<typeof receiptEventSchema>;
export type ReceiptPayload = z.infer<typeof receiptPayloadSchema>;
