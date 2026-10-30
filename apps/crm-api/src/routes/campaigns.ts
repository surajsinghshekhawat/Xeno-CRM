import type { FastifyInstance } from "fastify";
import {
  campaignListQuerySchema,
  createCampaignSchema,
} from "@xeno/shared";
import { AppError } from "../middleware/error-handler.js";
import {
  createCampaign,
  getCampaignById,
  launchCampaign,
  listCampaigns,
  retryCampaignLaunch,
} from "../services/campaign.service.js";

export async function campaignRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = campaignListQuerySchema.parse(request.query);
    return listCampaigns(query);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const campaign = await getCampaignById(id);

    if (!campaign) {
      throw new AppError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
    }

    return campaign;
  });

  app.post("/", async (request, reply) => {
    const body = createCampaignSchema.parse(request.body);
    const campaign = await createCampaign(body);
    return reply.status(201).send(campaign);
  });

  app.post("/:id/launch", async (request) => {
    const { id } = request.params as { id: string };
    return launchCampaign(id);
  });

  app.post("/:id/retry-dispatch", async (request) => {
    const { id } = request.params as { id: string };
    return retryCampaignLaunch(id);
  });
}
