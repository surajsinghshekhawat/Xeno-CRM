import type { FastifyInstance } from "fastify";
import { channelSendRequestSchema } from "@xeno/shared";
import { simulateCampaignSend } from "../services/simulator.service.js";

export async function sendRoutes(app: FastifyInstance) {
  app.post("/send", async (request, reply) => {
    const payload = channelSendRequestSchema.parse(request.body);
    const jobId = crypto.randomUUID();

    simulateCampaignSend(payload, jobId).catch((error) => {
      app.log.error({ error, jobId }, "Campaign simulation failed");
    });

    return reply.status(200).send({ accepted: true, jobId });
  });
}
