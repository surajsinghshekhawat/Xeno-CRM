import type { GetCustomerProfileInput } from "@xeno/shared";
import { getCustomerById } from "../../services/customer.service.js";

export async function handleGetCustomerProfile(input: GetCustomerProfileInput) {
  const customer = await getCustomerById(input.customerId);
  if (!customer) {
    return { error: "Customer not found" };
  }
  return { customer };
}
