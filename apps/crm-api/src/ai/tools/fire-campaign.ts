import type { FireCampaignInput } from "@xeno/shared";
import {
  createCampaign,
  launchCampaign,
} from "../../services/campaign.service.js";
import { getCustomerIdsForSegment } from "../../services/segment.service.js";

export async function handleFireCampaign(
  input: FireCampaignInput,
  options?: { serverConfirmed?: boolean },
) {
  const confirmed = options?.serverConfirmed === true;
  const customerIds = await getCustomerIdsForSegment(input.segmentFilters);

  const draft = {
    name: input.campaignName,
    goal: input.goal ?? input.campaignName,
    segmentDefinition: {
      filters: input.segmentFilters,
      description: input.segmentFilters.description,
    },
    messageTemplate: input.message,
    channel: input.channel,
    segmentSize: customerIds.length,
  };

  if (!confirmed) {
    return {
      blocked: true,
      requiresConfirmation: true,
      message:
        "Campaign launch requires explicit user confirmation. Present the draft and ask the user to confirm before launching.",
      draft,
    };
  }

  if (customerIds.length === 0) {
    return {
      blocked: true,
      message: "Segment matched zero customers. Adjust filters before launching.",
    };
  }

  const campaign = await createCampaign({
    name: draft.name,
    goal: draft.goal,
    segmentDefinition: draft.segmentDefinition,
    segmentSize: customerIds.length,
    messageTemplate: draft.messageTemplate,
    channel: draft.channel,
  });

  const launched = await launchCampaign(campaign.id);

  if (!launched.dispatch.success) {
    return {
      blocked: false,
      campaignId: launched.id,
      status: launched.status,
      segmentSize: launched.segmentSize,
      dispatchFailed: true,
      dispatch: launched.dispatch,
      message:
        launched.dispatch.message ??
        "Channel service is currently unavailable. Campaign created — retry dispatch when the stub is back online.",
    };
  }

  return {
    blocked: false,
    campaignId: launched.id,
    status: launched.status,
    segmentSize: launched.segmentSize,
    dispatch: launched.dispatch,
  };
}
