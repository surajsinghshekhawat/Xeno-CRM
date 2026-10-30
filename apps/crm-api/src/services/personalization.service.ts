import type { CustomerTag } from "@prisma/client";

export type PersonalizationInput = {
  name: string;
  tag: CustomerTag | string;
};

/** Template + rules personalization: {name} substitution and VIP tone variant. */
export function personalizeMessage(
  template: string,
  customer: PersonalizationInput,
): string {
  const firstName = customer.name.split(" ")[0] ?? customer.name;
  let message = template.replaceAll("{name}", firstName);

  if (customer.tag === "VIP") {
    message = message.replace("Hey", "Hi").replace("!", " — as a valued member,");
  }

  return message;
}
