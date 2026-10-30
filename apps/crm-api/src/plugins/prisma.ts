import type { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (app) => {
  app.decorate("prisma", prisma);

  try {
    await prisma.$connect();
    app.log.info("Prisma connected to database");
  } catch (err) {
    app.log.warn({ err }, "Prisma failed to connect — API running in degraded mode");
  }

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
    app.log.info("Prisma disconnected");
  });
});
