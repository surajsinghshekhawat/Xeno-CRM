import type { RecipientStatus } from "@prisma/client";
import type { ReceiptEvent } from "@xeno/shared";

const EVENT_STATUS: Record<ReceiptEvent, RecipientStatus> = {
  delivered: "DELIVERED",
  failed: "FAILED",
  opened: "OPENED",
  clicked: "CLICKED",
  converted: "CONVERTED",
};

const STATUS_RANK: Record<RecipientStatus, number> = {
  QUEUED: 0,
  SENT: 1,
  FAILED: 1,
  DELIVERED: 2,
  OPENED: 3,
  CLICKED: 4,
  CONVERTED: 5,
};

const ALLOWED: Record<RecipientStatus, RecipientStatus[]> = {
  QUEUED: ["SENT"],
  SENT: ["DELIVERED", "FAILED"],
  DELIVERED: ["OPENED"],
  OPENED: ["CLICKED"],
  CLICKED: ["CONVERTED"],
  FAILED: ["DELIVERED"],
  CONVERTED: [],
};

export function eventToStatus(event: ReceiptEvent): RecipientStatus {
  return EVENT_STATUS[event];
}

export function canTransition(
  current: RecipientStatus,
  next: RecipientStatus,
): boolean {
  if (current === next) return true;
  return ALLOWED[current]?.includes(next) ?? false;
}

/** Idempotent if the event status is already applied or superseded. */
export function isDuplicateEvent(
  current: RecipientStatus,
  event: ReceiptEvent,
): boolean {
  const next = eventToStatus(event);

  if (current === next) return true;

  if (event === "failed" && current === "FAILED") return true;

  if (event !== "failed" && current !== "FAILED") {
    return STATUS_RANK[current] >= STATUS_RANK[next];
  }

  return false;
}

export const TERMINAL_STATUSES = new Set<RecipientStatus>([
  "FAILED",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "CONVERTED",
]);

export function isTerminalStatus(status: RecipientStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function timestampFieldForEvent(
  event: ReceiptEvent,
): keyof Pick<
  import("@prisma/client").CampaignRecipient,
  "sentAt" | "deliveredAt" | "openedAt" | "clickedAt" | "convertedAt"
> | null {
  switch (event) {
    case "delivered":
      return "deliveredAt";
    case "opened":
      return "openedAt";
    case "clicked":
      return "clickedAt";
    case "converted":
      return "convertedAt";
    default:
      return null;
  }
}
