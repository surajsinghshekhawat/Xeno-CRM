import { prisma } from "../lib/prisma.js";
import { getCampaignById } from "../services/campaign.service.js";
import { getGeminiModel } from "./gemini.js";

export async function generatePostCampaignSummary(
  campaignId: string,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return;

  const campaign = await getCampaignById(campaignId);
  if (!campaign || campaign.status !== "COMPLETED") return;

  if (campaign.aiSummary) return;

  try {
    const { generateText } = await import("ai");
    const model = getGeminiModel();

    const { text } = await generateText({
      model,
      prompt: `Write a 2-3 sentence post-campaign summary for Thread & Co. marketers.

Campaign: ${campaign.name}
Channel: ${campaign.channel}
Segment size: ${campaign.segmentSize}
Delivery rate: ${campaign.metrics.deliveryRate}%
Open rate: ${campaign.metrics.openRate}%
Click rate: ${campaign.metrics.clickRate}%
Conversion rate: ${campaign.metrics.conversionRate}%
Failed: ${campaign.metrics.failed} (${campaign.metrics.failedRate}%)

Be specific with numbers. No markdown.`,
    });

    const summary = text.trim();
    if (!summary) return;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { aiSummary: summary },
    });
  } catch {
    // Non-blocking async job
  }
}
