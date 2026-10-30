import type { FastifyInstance } from "fastify";
import { BRAND } from "@xeno/shared";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    service: "crm-api",
    brand: BRAND.name,
    health: "/health",
    api: "/api",
  }));

  app.get("/health", async (_request, reply) => {
    let database: "connected" | "disconnected" = "disconnected";

    try {
      await app.prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "disconnected";
    }

    const payload = {
      status: database === "connected" ? "ok" : "degraded",
      service: "crm-api",
      brand: BRAND.name,
      database,
      timestamp: new Date().toISOString(),
    };

    return reply.status(200).send(payload);
  });
}
