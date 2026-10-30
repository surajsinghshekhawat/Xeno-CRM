import type { FastifyInstance } from "fastify";
import { analyticsRoutes } from "./analytics.js";
import { aiChatRoutes } from "./ai-chat.js";
import { receiptRoutes } from "./receipts.js";
import { campaignRoutes } from "./campaigns.js";
import { customerRoutes } from "./customers.js";
import { dashboardRoutes } from "./dashboard.js";
import { insightsRoutes } from "./insights.js";
import { orderRoutes } from "./orders.js";

export async function apiRoutes(app: FastifyInstance) {
  await app.register(customerRoutes, { prefix: "/api/customers" });
  await app.register(orderRoutes, { prefix: "/api/orders" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
  await app.register(insightsRoutes, { prefix: "/api/insights" });
  await app.register(campaignRoutes, { prefix: "/api/campaigns" });
  await app.register(aiChatRoutes, { prefix: "/api/ai" });
  await app.register(receiptRoutes, { prefix: "/api/receipt" });
}