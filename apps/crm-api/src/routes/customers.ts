import type { FastifyInstance } from "fastify";
import {
  csvImportRequestSchema,
  customerListQuerySchema,
} from "@xeno/shared";
import { AppError } from "../middleware/error-handler.js";
import { getCustomerById, listCustomers } from "../services/customer.service.js";
import { importCsvCustomers, previewCsvImport } from "../services/csv-import.service.js";

export async function customerRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = customerListQuerySchema.parse(request.query);
    return listCustomers(query);
  });

  app.post("/import", async (request) => {
    const body = csvImportRequestSchema.parse(request.body);

    if (body.mode === "preview") {
      return previewCsvImport(body.csv);
    }

    return importCsvCustomers(body.csv);
  });

  app.get("/:id", async (request) => {    const { id } = request.params as { id: string };
    const customer = await getCustomerById(id);

    if (!customer) {
      throw new AppError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
    }

    return customer;
  });
}
