import type { FastifyInstance } from "fastify";
import { orderListQuerySchema } from "@xeno/shared";
import { listOrders } from "../services/order.service.js";

export async function orderRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = orderListQuerySchema.parse(request.query);
    return listOrders(query);
  });
}
