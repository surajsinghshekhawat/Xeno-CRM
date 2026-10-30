import type { FastifyInstance } from "fastify";
import { getAnalyticsOverview } from "../services/analytics.service.js";

export async function analyticsRoutes(app: FastifyInstance) {
  app.get("/overview", async () => getAnalyticsOverview());
}
