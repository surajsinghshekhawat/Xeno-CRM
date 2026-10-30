import fp from "fastify-plugin";
import { Server, type Socket } from "socket.io";
import { initRealtime } from "../services/realtime.service.js";
import { parseOrigins } from "./cors.js";

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
}

export default fp(async (app) => {
  const origins = parseOrigins();
  const corsOrigins = Array.isArray(origins) ? origins : [origins];

  const io = new Server(app.server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    path: "/socket.io",
  });

  initRealtime(io);
  app.decorate("io", io);

  app.addHook("onClose", async () => {
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
  });

  app.log.info("Socket.io initialized");
});
