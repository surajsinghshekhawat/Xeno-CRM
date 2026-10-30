import type { GetTopSpendersInput } from "@xeno/shared";
import { getTopSpenders } from "../../services/segment.service.js";

export async function handleGetTopSpenders(input: GetTopSpendersInput) {
  return getTopSpenders(input.limit, input.daysSinceLastPurchase);
}
