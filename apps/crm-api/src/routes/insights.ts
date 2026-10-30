import type { FastifyInstance } from "fastify";
import { polishInsightMessage } from "../ai/insight-polish.js";
import { getPrimaryInsight } from "../services/insights.service.js";

export async function insightsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const result = await getPrimaryInsight();
    if (!result.insight) return result;

    const polished = await polishInsightMessage(result.insight);
    return {
      ...result,
      insight: polished,
    };
  });
}
