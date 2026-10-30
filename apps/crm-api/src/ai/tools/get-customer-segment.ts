import type { GetCustomerSegmentInput } from "@xeno/shared";
import { getCustomerSegment } from "../../services/segment.service.js";

export async function handleGetCustomerSegment(input: GetCustomerSegmentInput) {
  return getCustomerSegment(input.filters, {
    limit: input.limit,
    description: input.description,
  });
}
