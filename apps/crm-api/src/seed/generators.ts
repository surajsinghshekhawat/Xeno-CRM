import type {
  CampaignChannel,
  CampaignStatus,
  CustomerTag,
  OrderChannel,
  OrderStatus,
  Prisma,
  RecipientStatus,
} from "@prisma/client";
import {
  createRng,
  deterministicId,
  floatBetween,
  intBetween,
  maybe,
  pick,
} from "./rng.js";

const FIRST_NAMES = [
  "Priya",
  "Rahul",
  "Ananya",
  "Arjun",
  "Sneha",
  "Vikram",
  "Meera",
  "Aditya",
  "Kavya",
  "Rohan",
  "Divya",
  "Karan",
  "Shreya",
  "Amit",
  "Neha",
  "Sanjay",
  "Pooja",
  "Ravi",
  "Lakshmi",
  "Deepak",
  "Isha",
  "Manish",
  "Tanvi",
  "Nikhil",
  "Aisha",
  "Varun",
  "Nisha",
  "Harish",
  "Simran",
  "Akash",
] as const;

const LAST_NAMES = [
  "Mehta",
  "Sharma",
  "Patel",
  "Iyer",
  "Reddy",
  "Singh",
  "Gupta",
  "Nair",
  "Kapoor",
  "Desai",
  "Joshi",
  "Malhotra",
  "Chopra",
  "Bose",
  "Khan",
  "Verma",
  "Rao",
  "Pillai",
  "Shetty",
  "Banerjee",
] as const;

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
] as const;

const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54"] as const;
const GENDERS = ["Female", "Male", "Non-binary"] as const;

const FASHION_ITEMS = [
  { name: "Linen Kurta Set", basePrice: 2499 },
  { name: "Denim Jacket", basePrice: 3299 },
  { name: "Silk Saree", basePrice: 8999 },
  { name: "Cotton Tee (2-pack)", basePrice: 1299 },
  { name: "Leather Belt", basePrice: 1899 },
  { name: "Running Sneakers", basePrice: 4499 },
  { name: "Palazzo Pants", basePrice: 2199 },
  { name: "Embroidered Dupatta", basePrice: 2799 },
  { name: "Wool Blazer", basePrice: 5999 },
  { name: "Crossbody Bag", basePrice: 3499 },
  { name: "Ankle Boots", basePrice: 4999 },
  { name: "Printed Maxi Dress", basePrice: 3799 },
] as const;

const ORDER_CHANNELS: OrderChannel[] = ["ONLINE", "IN_STORE", "APP"];
const CHANNEL_WEIGHTS = [0.7, 0.1, 0.2];

type CustomerArchetype = "NEW" | "REGULAR" | "VIP" | "LAPSED" | "AT_RISK";

export type GeneratedCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  ageGroup: string;
  gender: string;
  archetype: CustomerArchetype;
};

export type GeneratedOrder = {
  id: string;
  customerId: string;
  items: Prisma.InputJsonValue;
  totalValue: number;
  channel: OrderChannel;
  status: OrderStatus;
  createdAt: Date;
};

export type GeneratedCampaign = {
  id: string;
  name: string;
  goal: string;
  segmentDefinition: Prisma.InputJsonValue;
  segmentSize: number;
  messageTemplate: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  aiSummary: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type CampaignSpec = GeneratedCampaign;

export type RecipientOutcome = {
  status: RecipientStatus;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  convertedAt: Date | null;
  failureReason: string | null;
};

export type SeedBundle = {
  customers: GeneratedCustomer[];
  orders: GeneratedOrder[];
  campaigns: CampaignSpec[];
};

export const FIXED_SEED_REFERENCE_DATE = new Date("2025-06-15T12:00:00.000Z");

const MIN_ORDER_COUNT = 500;
const MAX_ORDER_COUNT = 700;
const TARGET_ORDER_COUNT = 600;

const ARCHETYPE_COUNTS: Record<CustomerArchetype, number> = {
  NEW: 30,
  REGULAR: 90,
  VIP: 30,
  LAPSED: 40,
  AT_RISK: 10,
};

function weightedChannel(rng: () => number): OrderChannel {
  const roll = rng();
  const online = CHANNEL_WEIGHTS[0] ?? 0.7;
  const inStore = CHANNEL_WEIGHTS[1] ?? 0.1;
  if (roll < online) return "ONLINE";
  if (roll < online + inStore) return "IN_STORE";
  return "APP";
}

function daysAgo(days: number, referenceDate: Date, rng?: () => number): Date {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - days);
  const hour = rng ? intBetween(rng, 10, 20) : 12;
  date.setHours(hour, 0, 0, 0);
  return date;
}

function generatePhone(rng: () => number): string {
  const prefixes = ["98", "97", "96", "95", "94", "91", "90", "89", "88", "87"];
  const prefix = pick(rng, prefixes);
  const rest = String(intBetween(rng, 10000000, 99999999));
  return `+91${prefix}${rest}`;
}

function generateOrderItems(rng: () => number, targetValue?: number): {
  items: Prisma.InputJsonValue;
  totalValue: number;
} {
  const itemCount = intBetween(rng, 1, 3);
  const items: { name: string; quantity: number; price: number }[] = [];
  let totalValue = 0;

  for (let i = 0; i < itemCount; i++) {
    const product = pick(rng, FASHION_ITEMS);
    const quantity = intBetween(rng, 1, 2);
    const price = Math.round(product.basePrice * floatBetween(rng, 0.9, 1.15));
    items.push({ name: product.name, quantity, price });
    totalValue += price * quantity;
  }

  if (targetValue !== undefined) {
    const scale = targetValue / Math.max(totalValue, 1);
    for (const item of items) {
      item.price = Math.round(item.price * scale);
    }
    totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  return { items, totalValue: Math.round(totalValue) };
}

function generateOrdersForCustomer(
  rng: () => number,
  customer: GeneratedCustomer,
  referenceDate: Date,
  seedOnly: boolean,
): GeneratedOrder[] {
  const orders: GeneratedOrder[] = [];
  const now = referenceDate;

  const addOrder = (
    daysBack: number,
    targetValue: number,
    status: OrderStatus = "COMPLETED",
  ) => {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysBack);
    createdAt.setHours(intBetween(rng, 10, 21), intBetween(rng, 0, 59), 0, 0);
    const { items, totalValue } = generateOrderItems(rng, targetValue);

    orders.push({
      id: seedOnly
        ? deterministicId("order", `${customer.id}-${orders.length}`)
        : crypto.randomUUID(),
      customerId: customer.id,
      items,
      totalValue,
      channel: weightedChannel(rng),
      status,
      createdAt,
    });
  };

  switch (customer.archetype) {
    case "NEW":
      addOrder(intBetween(rng, 3, 25), floatBetween(rng, 500, 3000));
      break;

    case "REGULAR": {
      const orderCount = intBetween(rng, 2, 5);
      for (let i = 0; i < orderCount; i++) {
        const daysBack = i === 0 ? intBetween(rng, 5, 28) : intBetween(rng, 30, 540);
        addOrder(daysBack, floatBetween(rng, 3000, 15000));
      }
      break;
    }

    case "VIP": {
      const orderCount = intBetween(rng, 4, 8);
      for (let i = 0; i < orderCount; i++) {
        const daysBack = i === 0 ? intBetween(rng, 7, 45) : intBetween(rng, 30, 540);
        addOrder(daysBack, floatBetween(rng, 15000, 80000) / orderCount);
      }
      break;
    }

    case "LAPSED": {
      const orderCount = intBetween(rng, 1, 3);
      for (let i = 0; i < orderCount; i++) {
        addOrder(intBetween(rng, 90, 540), floatBetween(rng, 2000, 20000));
      }
      break;
    }

    case "AT_RISK": {
      addOrder(intBetween(rng, 35, 55), floatBetween(rng, 8000, 15000));
      addOrder(intBetween(rng, 70, 120), floatBetween(rng, 12000, 22000));
      addOrder(intBetween(rng, 150, 300), floatBetween(rng, 15000, 25000));
      break;
    }
  }

  return orders;
}

function buildRecipientOutcome(
  rng: () => number,
  baseDate: Date,
  channel: CampaignChannel,
): RecipientOutcome {
  const openRate = channel === "WHATSAPP" ? 0.6 : 0.45;
  const sentAt = new Date(baseDate.getTime() + intBetween(rng, 1, 120) * 60_000);

  if (rng() < 0.12) {
    const reasons = ["invalid_number", "user_opted_out", "network_timeout"] as const;
    return {
      status: "FAILED",
      sentAt,
      deliveredAt: null,
      openedAt: null,
      clickedAt: null,
      convertedAt: null,
      failureReason: pick(rng, reasons),
    };
  }

  const deliveredAt = new Date(sentAt.getTime() + intBetween(rng, 2, 30) * 1000);
  let status: RecipientStatus = "DELIVERED";
  let openedAt: Date | null = null;
  let clickedAt: Date | null = null;
  let convertedAt: Date | null = null;

  if (rng() < openRate) {
    openedAt = new Date(deliveredAt.getTime() + intBetween(rng, 60, 3600) * 1000);
    status = "OPENED";

    if (rng() < 0.35) {
      clickedAt = new Date(openedAt.getTime() + intBetween(rng, 30, 900) * 1000);
      status = "CLICKED";

      if (rng() < 0.45) {
        convertedAt = new Date(clickedAt.getTime() + intBetween(rng, 300, 7200) * 1000);
        status = "CONVERTED";
      }
    }
  }

  return {
    status,
    sentAt,
    deliveredAt,
    openedAt,
    clickedAt,
    convertedAt,
    failureReason: null,
  };
}

function personalizeMessage(template: string, name: string, tag: CustomerTag): string {
  let message = template.replaceAll("{name}", name.split(" ")[0] ?? name);
  if (tag === "VIP") {
    message = message.replace("Hey", "Hi").replace("!", " — as a valued member,");
  }
  return message;
}

export function buildRecipientOutcomes(
  rng: () => number,
  count: number,
  baseDate: Date,
  channel: CampaignChannel,
): RecipientOutcome[] {
  return Array.from({ length: count }, () =>
    buildRecipientOutcome(rng, baseDate, channel),
  );
}

function addSupplementaryOrder(
  rng: () => number,
  customer: GeneratedCustomer,
  referenceDate: Date,
  seedOnly: boolean,
  orderIndex: number,
): GeneratedOrder {
  const createdAt = new Date(referenceDate);
  createdAt.setDate(createdAt.getDate() - intBetween(rng, 30, 400));
  createdAt.setHours(intBetween(rng, 10, 21), intBetween(rng, 0, 59), 0, 0);
  const { items, totalValue } = generateOrderItems(rng, floatBetween(rng, 2000, 8000));

  return {
    id: seedOnly
      ? deterministicId("order-extra", `${customer.id}-${orderIndex}`)
      : crypto.randomUUID(),
    customerId: customer.id,
    items,
    totalValue,
    channel: weightedChannel(rng),
    status: "COMPLETED",
    createdAt,
  };
}

export function normalizeOrderCount(
  orders: GeneratedOrder[],
  customers: GeneratedCustomer[],
  rng: () => number,
  referenceDate: Date,
  seedOnly: boolean,
): GeneratedOrder[] {
  const result = [...orders];
  const expandable = customers.filter((c) =>
    ["REGULAR", "VIP", "LAPSED"].includes(c.archetype),
  );

  while (result.length < TARGET_ORDER_COUNT && expandable.length > 0) {
    const customer = pick(rng, expandable);
    result.push(
      addSupplementaryOrder(rng, customer, referenceDate, seedOnly, result.length),
    );
  }

  while (result.length > MAX_ORDER_COUNT) {
    const counts = new Map<string, number>();
    for (const order of result) {
      counts.set(order.customerId, (counts.get(order.customerId) ?? 0) + 1);
    }

    const removableCustomerId = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!removableCustomerId) break;

    const removeIndex = result.findIndex((o) => o.customerId === removableCustomerId);
    if (removeIndex >= 0) result.splice(removeIndex, 1);
  }

  if (result.length < MIN_ORDER_COUNT || result.length > MAX_ORDER_COUNT) {
    throw new Error(
      `Unable to normalize order count to 500-700 (got ${result.length})`,
    );
  }

  return result;
}

export function earliestOrderDate(orders: GeneratedOrder[], customerId: string): Date {
  const customerOrders = orders.filter((o) => o.customerId === customerId);
  return customerOrders.reduce(
    (earliest, order) => (order.createdAt < earliest ? order.createdAt : earliest),
    customerOrders[0]!.createdAt,
  );
}

export function generateSeedData(options: {
  seedOnly: boolean;
  referenceDate?: Date;
}): SeedBundle {
  const referenceDate =
    options.referenceDate ??
    (options.seedOnly ? FIXED_SEED_REFERENCE_DATE : new Date());
  const rng = createRng(options.seedOnly ? 42_069 : Date.now());
  const customers: GeneratedCustomer[] = [];
  let customerIndex = 0;

  for (const [archetype, count] of Object.entries(ARCHETYPE_COUNTS) as [
    CustomerArchetype,
    number,
  ][]) {
    for (let i = 0; i < count; i++) {
      const first = pick(rng, FIRST_NAMES);
      const last = pick(rng, LAST_NAMES);
      const name = `${first} ${last}`;
      const slug = `${first.toLowerCase()}.${last.toLowerCase()}${customerIndex}`;

      customers.push({
        id: options.seedOnly
          ? deterministicId("customer", String(customerIndex))
          : crypto.randomUUID(),
        name,
        email: `${slug}@threadandco.in`,
        phone: maybe(rng, 0.85, generatePhone(rng)),
        city: pick(rng, CITIES),
        ageGroup: pick(rng, AGE_GROUPS),
        gender: pick(rng, GENDERS),
        archetype,
      });
      customerIndex++;
    }
  }

  let orders = customers.flatMap((customer) =>
    generateOrdersForCustomer(rng, customer, referenceDate, options.seedOnly),
  );

  orders = normalizeOrderCount(
    orders,
    customers,
    rng,
    referenceDate,
    options.seedOnly,
  );

  const campaigns: CampaignSpec[] = [
    {
      id: options.seedOnly ? deterministicId("campaign", "0") : crypto.randomUUID(),
      name: "Summer Win-Back",
      goal: "Win back lapsed customers with urgency-driven WhatsApp offer",
      segmentDefinition: {
        filters: { tags: ["LAPSED"], spendMin: 2000 },
        description: "Lapsed customers with meaningful past spend",
      },
      segmentSize: 40,
      messageTemplate:
        "Hey {name}! We miss you at Thread & Co. Your favourites are back — enjoy 20% off for 48 hours only. Tap to shop →",
      channel: "WHATSAPP",
      status: "COMPLETED",
      aiSummary:
        "Strong performance driven by urgency framing. WhatsApp open rate hit 52%, above the brand average. Consider a follow-up to non-openers within 5 days.",
      createdAt: daysAgo(7, referenceDate, rng),
      completedAt: daysAgo(6, referenceDate, rng),
    },
    {
      id: options.seedOnly ? deterministicId("campaign", "1") : crypto.randomUUID(),
      name: "VIP Early Access",
      goal: "Reward top spenders with early access to the festive collection",
      segmentDefinition: {
        filters: { tags: ["VIP"] },
        description: "Top 10% spenders",
      },
      segmentSize: 20,
      messageTemplate:
        "Hi {name}, you're invited to shop our Festive Collection 24 hours before everyone else. Exclusive styles await →",
      channel: "EMAIL",
      status: "COMPLETED",
      aiSummary:
        "Email delivered reliably to VIPs with a 38% open rate. Click-through was modest at 12% — shorter subject lines may help next time.",
      createdAt: daysAgo(30, referenceDate, rng),
      completedAt: daysAgo(29, referenceDate, rng),
    },
    {
      id: options.seedOnly ? deterministicId("campaign", "2") : crypto.randomUUID(),
      name: "New Customer Welcome",
      goal: "Welcome first-time buyers and nudge a second purchase",
      segmentDefinition: {
        filters: { tags: ["NEW"] },
        description: "Customers who joined in the last 30 days",
      },
      segmentSize: 30,
      messageTemplate:
        "Welcome to Thread & Co., {name}! Here's 10% off your next order — our stylists picked pieces we think you'll love.",
      channel: "SMS",
      status: "COMPLETED",
      aiSummary:
        "Solid welcome campaign with 41% open rate. Conversion at 6% suggests the offer resonated — test a stronger CTA in the next cohort.",
      createdAt: daysAgo(14, referenceDate, rng),
      completedAt: daysAgo(13, referenceDate, rng),
    },
    {
      id: options.seedOnly ? deterministicId("campaign", "3") : crypto.randomUUID(),
      name: "Festive Flash Sale",
      goal: "Drive revenue from engaged regular shoppers during festive season",
      segmentDefinition: {
        filters: { tags: ["REGULAR"], spendMin: 5000 },
        description: "Regular customers with ₹5,000+ lifetime spend",
      },
      segmentSize: 60,
      messageTemplate:
        "Hey {name}! Thread & Co. Festive Flash Sale is live — up to 40% off bestsellers. Ends midnight tonight!",
      channel: "WHATSAPP",
      status: "COMPLETED",
      aiSummary:
        "One of the highest-converting campaigns at 9% conversion. Flash-sale urgency and WhatsApp channel were a strong combo.",
      createdAt: daysAgo(45, referenceDate, rng),
      completedAt: daysAgo(44, referenceDate, rng),
    },
    {
      id: options.seedOnly ? deterministicId("campaign", "4") : crypto.randomUUID(),
      name: "Monsoon Collection Launch",
      goal: "Announce monsoon arrivals to active regular and VIP customers",
      segmentDefinition: {
        filters: { tags: ["REGULAR", "VIP"] },
        description: "Active regular and VIP customers",
      },
      segmentSize: 50,
      messageTemplate:
        "Hi {name}! Our Monsoon Collection just dropped — waterproof layers, breezy cottons, and new prints. Shop now →",
      channel: "WHATSAPP",
      status: "COMPLETED",
      aiSummary: null,
      createdAt: daysAgo(3, referenceDate, rng),
      completedAt: daysAgo(2, referenceDate, rng),
    },
  ];

  return { customers, orders, campaigns };
}

export { personalizeMessage };
