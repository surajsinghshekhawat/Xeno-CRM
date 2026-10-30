import Fastify from "fastify";
import { PORTS } from "@xeno/shared";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import socketPlugin from "./plugins/socket.js";
import { healthRoutes } from "./routes/health.js";
import { apiRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(socketPlugin);
  await app.register(healthRoutes);
  await app.register(apiRoutes);

  return app;
}

export async function start() {
  const port = Number(process.env.CRM_API_PORT ?? process.env.PORT ?? PORTS.crmApi);
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`CRM API running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
