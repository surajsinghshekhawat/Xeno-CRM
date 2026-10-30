import type { CustomerTag } from "@prisma/client";
import type { SegmentDefinition } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";
import { getCustomerIdsForSegment } from "../services/segment.service.js";
import { refreshAllCustomerTags } from "../services/tag-refresh.service.js";
import {
  buildRecipientOutcomes,
  earliestOrderDate,
  generateSeedData,
  personalizeMessage,
} from "./generators.js";
import { createRng, deterministicId, shuffle } from "./rng.js";

function assertSeedCounts(
  customerCount: number,
  orderCount: number,
  campaignCount: number,
): void {
  if (customerCount !== 200) {
    throw new Error(`Seed validation failed: expected 200 customers, got ${customerCount}`);
  }
  if (orderCount < 500 || orderCount > 700) {
    throw new Error(
      `Seed validation failed: expected 500-700 orders, got ${orderCount}`,
    );
  }
  if (campaignCount !== 5) {
    throw new Error(`Seed validation failed: expected 5 campaigns, got ${campaignCount}`);
  }
}

export async function runSeed(): Promise<void> {
  const seedOnly = process.env.SEED_ONLY === "true";
  const outcomeRng = createRng(seedOnly ? 42_069 : Date.now());
  console.log(`🌱 Seeding XenoCRM (SEED_ONLY=${seedOnly})...`);

  const existingCustomers = await prisma.customer.count();
  if (existingCustomers > 0) {
    console.log(`Clearing existing data (${existingCustomers} customers)...`);
    await prisma.campaignRecipient.deleteMany();
    await prisma.aIConversation.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
  }

  const { customers, orders, campaigns } = generateSeedData({ seedOnly });

  console.log(`Creating ${customers.length} customers...`);
  await prisma.customer.createMany({
    data: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      ageGroup: c.ageGroup,
      gender: c.gender,
      tag: "NEW" as CustomerTag,
      totalSpend: 0,
      orderCount: 0,
      createdAt: earliestOrderDate(orders, c.id),
    })),
  });

  console.log(`Creating ${orders.length} orders...`);
  const ORDER_BATCH = 100;
  for (let i = 0; i < orders.length; i += ORDER_BATCH) {
    await prisma.order.createMany({
      data: orders.slice(i, i + ORDER_BATCH),
    });
  }

  console.log("Recomputing customer tags from order history...");
  const refreshed = await refreshAllCustomerTags();
  console.log(`Tags refreshed for ${refreshed} customers.`);

  const customerTagMap = new Map(
    (await prisma.customer.findMany({ select: { id: true, tag: true, name: true } })).map(
      (c) => [c.id, c] as const,
    ),
  );

  console.log(`Creating ${campaigns.length} campaigns with segment-matched recipients...`);
  for (const campaign of campaigns) {
    const segmentDefinition = campaign.segmentDefinition as SegmentDefinition;
    const segmentCustomerIds = shuffle(
      outcomeRng,
      await getCustomerIdsForSegment(segmentDefinition.filters),
    ).slice(0, campaign.segmentSize);

    const outcomes = buildRecipientOutcomes(
      outcomeRng,
      segmentCustomerIds.length,
      campaign.createdAt,
      campaign.channel,
    );

    await prisma.campaign.create({
      data: {
        id: campaign.id,
        name: campaign.name,
        goal: campaign.goal,
        segmentDefinition: campaign.segmentDefinition,
        segmentSize: segmentCustomerIds.length,
        messageTemplate: campaign.messageTemplate,
        channel: campaign.channel,
        status: campaign.status,
        aiSummary: campaign.aiSummary,
        createdAt: campaign.createdAt,
        completedAt: campaign.completedAt,
        recipients: {
          create: segmentCustomerIds.map((customerId, index) => {
            const customer = customerTagMap.get(customerId);
            const outcome = outcomes[index]!;

            return {
              id: seedOnly
                ? deterministicId("recipient", `${campaign.id}-${index}`)
                : crypto.randomUUID(),
              customerId,
              personalizedMsg: personalizeMessage(
                campaign.messageTemplate,
                customer?.name ?? "there",
                customer?.tag ?? "REGULAR",
              ),
              status: outcome.status,
              sentAt: outcome.sentAt,
              deliveredAt: outcome.deliveredAt,
              openedAt: outcome.openedAt,
              clickedAt: outcome.clickedAt,
              convertedAt: outcome.convertedAt,
              failureReason: outcome.failureReason,
            };
          }),
        },
      },
    });
  }

  const [customerCount, orderCount, campaignCount, recipientCount] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.campaign.count(),
    prisma.campaignRecipient.count(),
  ]);

  assertSeedCounts(customerCount, orderCount, campaignCount);

  const tagBreakdown = await prisma.customer.groupBy({
    by: ["tag"],
    _count: { tag: true },
  });

  console.log("\n✅ Seed complete");
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Orders: ${orderCount}`);
  console.log(`   Campaigns: ${campaignCount}`);
  console.log(`   Recipients: ${recipientCount}`);
  console.log("   Tag breakdown:", tagBreakdown.map((t) => `${t.tag}=${t._count.tag}`).join(", "));
}
