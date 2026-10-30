import type { GetCampaignStatsInput } from "@xeno/shared";
import { getCampaignById, listCampaigns } from "../../services/campaign.service.js";

export async function handleGetCampaignStats(input: GetCampaignStatsInput) {
  if (input.campaignId) {
    const campaign = await getCampaignById(input.campaignId);
    if (!campaign) {
      return { error: "Campaign not found" };
    }
    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        channel: campaign.channel,
        segmentSize: campaign.segmentSize,
        metrics: campaign.metrics,
        aiSummary: campaign.aiSummary,
        createdAt: campaign.createdAt,
        completedAt: campaign.completedAt,
      },
    };
  }

  const list = await listCampaigns({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return {
    campaigns: list.data.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      channel: campaign.channel,
      segmentSize: campaign.segmentSize,
      metrics: campaign.metrics,
      createdAt: campaign.createdAt,
    })),
  };
}
