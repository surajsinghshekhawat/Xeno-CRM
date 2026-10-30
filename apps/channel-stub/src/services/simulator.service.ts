const FAILURE_REASONS = ["invalid_number", "user_opted_out", "network_timeout"] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFailureReason(): (typeof FAILURE_REASONS)[number] {
  const roll = Math.random();
  if (roll < 0.4) return "invalid_number";
  if (roll < 0.7) return "user_opted_out";
  return "network_timeout";
}

async function postReceipt(payload: Record<string, string>, attempt = 0): Promise<void> {
  const url = `${process.env.CRM_CALLBACK_URL ?? "http://localhost:3001"}/api/receipt`;
  const secret = process.env.STUB_SECRET ?? "change-me-in-production";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-stub-secret": secret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status >= 500 && attempt < 2) {
      await delay(1000);
      return postReceipt(payload, attempt + 1);
    }
  } catch {
    if (attempt < 2) {
      await delay(1000);
      return postReceipt(payload, attempt + 1);
    }
  }
}

async function simulateRecipient(
  campaignId: string,
  recipientId: string,
  customerId: string,
  channel: string,
): Promise<void> {
  await delay(randomBetween(2000, 25000));

  const deliveredRoll = Math.random();
  const failThreshold = 0.12;

  if (deliveredRoll < failThreshold) {
    const reason = pickFailureReason();

    if (reason === "network_timeout" && Math.random() < 0.5) {
      await delay(5000);
      await postReceipt({
        recipientId,
        campaignId,
        customerId,
        event: "delivered",
        timestamp: new Date().toISOString(),
      });
    } else {
      await postReceipt({
        recipientId,
        campaignId,
        customerId,
        event: "failed",
        timestamp: new Date().toISOString(),
        failureReason: reason,
      });
      return;
    }
  } else {
    await postReceipt({
      recipientId,
      campaignId,
      customerId,
      event: "delivered",
      timestamp: new Date().toISOString(),
    });
  }

  const openRate = channel === "WHATSAPP" ? 0.6 : 0.45;
  if (Math.random() >= openRate) return;

  await delay(randomBetween(1000, 5000));
  await postReceipt({
    recipientId,
    campaignId,
    customerId,
    event: "opened",
    timestamp: new Date().toISOString(),
  });

  if (Math.random() >= 0.35) return;

  await delay(randomBetween(500, 3000));
  await postReceipt({
    recipientId,
    campaignId,
    customerId,
    event: "clicked",
    timestamp: new Date().toISOString(),
  });

  if (Math.random() >= 0.45) return;

  await delay(randomBetween(1000, 8000));
  await postReceipt({
    recipientId,
    campaignId,
    customerId,
    event: "converted",
    timestamp: new Date().toISOString(),
  });
}

export async function simulateCampaignSend(
  payload: {
    campaignId: string;
    recipients: {
      recipientId: string;
      customerId: string;
      channel: string;
    }[];
  },
  jobId: string,
): Promise<void> {
  void jobId;

  for (const recipient of payload.recipients) {
    void simulateRecipient(
      payload.campaignId,
      recipient.recipientId,
      recipient.customerId,
      recipient.channel,
    );
  }
}
