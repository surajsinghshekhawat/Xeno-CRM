import { tool } from "ai";
import {
  fireCampaignInputSchema,
  getCampaignStatsInputSchema,
  getChurnRiskCustomersInputSchema,
  getCustomerProfileInputSchema,
  getCustomerSegmentInputSchema,
  getTopSpendersInputSchema,
} from "@xeno/shared";
import { handleFireCampaign } from "./fire-campaign.js";
import { handleGetCampaignStats } from "./get-campaign-stats.js";
import { handleGetChurnRiskCustomers } from "./get-churn-risk.js";
import { handleGetCustomerProfile } from "./get-customer-profile.js";
import { handleGetCustomerSegment } from "./get-customer-segment.js";
import { handleGetTopSpenders } from "./get-top-spenders.js";

export function createAiTools(options?: { serverConfirmed?: boolean }) {
  return {
    getCustomerSegment: tool({
      description:
        "Return customers matching segment filter criteria with preview rows and total count.",
      inputSchema: getCustomerSegmentInputSchema,
      execute: handleGetCustomerSegment,
    }),
    getCampaignStats: tool({
      description:
        "Return performance stats for a specific campaign or the 10 most recent campaigns.",
      inputSchema: getCampaignStatsInputSchema,
      execute: handleGetCampaignStats,
    }),
    getCustomerProfile: tool({
      description: "Return full customer profile including order history.",
      inputSchema: getCustomerProfileInputSchema,
      execute: handleGetCustomerProfile,
    }),
    getChurnRiskCustomers: tool({
      description:
        "Return customers at churn risk based on days since last purchase and optional minimum spend.",
      inputSchema: getChurnRiskCustomersInputSchema,
      execute: handleGetChurnRiskCustomers,
    }),
    getTopSpenders: tool({
      description:
        "Return top customers by total spend, optionally filtered by recent purchase activity.",
      inputSchema: getTopSpendersInputSchema,
      execute: handleGetTopSpenders,
    }),
    fireCampaign: tool({
      description:
        "Create and launch a campaign. Only succeeds after the user has explicitly confirmed in chat.",
      inputSchema: fireCampaignInputSchema,
      execute: (input) =>
        handleFireCampaign(input, { serverConfirmed: options?.serverConfirmed }),
    }),
  };
}

export type AiTools = ReturnType<typeof createAiTools>;

export {
  handleFireCampaign,
  handleGetCampaignStats,
  handleGetChurnRiskCustomers,
  handleGetCustomerProfile,
  handleGetCustomerSegment,
  handleGetTopSpenders,
};
