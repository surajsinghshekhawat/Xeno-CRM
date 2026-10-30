import type { FastifyInstance } from "fastify";
import { getDashboardStats } from "../services/dashboard.service.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/stats", async () => getDashboardStats());
}
