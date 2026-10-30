import type { GetChurnRiskCustomersInput } from "@xeno/shared";
import { getChurnRiskCustomers } from "../../services/segment.service.js";

export async function handleGetChurnRiskCustomers(
  input: GetChurnRiskCustomersInput,
) {
  return getChurnRiskCustomers(input.daysSinceLastPurchase, input.minSpend);
}
