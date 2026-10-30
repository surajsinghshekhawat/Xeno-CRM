import Fastify from "fastify";
import cors from "@fastify/cors";
import { PORTS } from "@xeno/shared";
import { sendRoutes } from "./routes/send.js";
const PORT = Number(
  process.env.CHANNEL_STUB_PORT ?? process.env.PORT ?? PORTS.channelStub,
);

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get("/", async () => ({
    service: "channel-stub",
    health: "/health",
    send: "POST /send",
  }));

  app.get("/health", async () => ({
    status: "ok",
    service: "channel-stub",
  }));

  await app.register(sendRoutes);

  return app;
}

export async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`Channel Stub running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
