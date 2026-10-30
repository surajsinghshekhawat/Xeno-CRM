import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { receiptPayloadSchema } from "@xeno/shared";
import { AppError } from "../middleware/error-handler.js";
import { processReceipt } from "../services/receipt.service.js";

const STUB_SECRET_HEADER = "x-stub-secret";

async function verifyStubSecret(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const expected = process.env.STUB_SECRET;
  if (!expected) {
    throw new AppError(500, "STUB_SECRET is not configured", "CONFIG_ERROR");
  }

  const provided = request.headers[STUB_SECRET_HEADER];
  if (typeof provided !== "string" || provided !== expected) {
    throw new AppError(401, "Unauthorized", "INVALID_STUB_SECRET");
  }
}

export async function receiptRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: verifyStubSecret },
    async (request) => {
      const payload = receiptPayloadSchema.parse(request.body);
      return processReceipt(payload);
    },
  );
}
