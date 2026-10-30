import cors from "@fastify/cors";
import fp from "fastify-plugin";

function parseOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  if (raw.includes(",")) {
    return raw.split(",").map((origin) => origin.trim());
  }
  return raw;
}

export default fp(async (app) => {
  await app.register(cors, {
    origin: parseOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
});

export { parseOrigins };
