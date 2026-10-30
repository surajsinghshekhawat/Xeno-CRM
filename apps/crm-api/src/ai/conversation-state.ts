import type { Prisma } from "@prisma/client";
import type { CampaignChannel } from "@prisma/client";
import type { SegmentDefinition } from "@xeno/shared";
import { prisma } from "../lib/prisma.js";

export type CampaignDraft = {
  name: string;
  goal: string;
  segmentDefinition: SegmentDefinition;
  segmentSize: number;
  messageTemplate: string;
  channel: CampaignChannel;
};

export type ConversationState = {
  draft?: CampaignDraft;
  awaitingConfirmation: boolean;
  confirmed: boolean;
};

export type StoredConversation = {
  version: 1;
  messages: unknown[];
  state: ConversationState;
};

const DEFAULT_STATE: ConversationState = {
  awaitingConfirmation: false,
  confirmed: false,
};

function normalizeStored(raw: unknown): StoredConversation {
  if (!raw || typeof raw !== "object") {
    return { version: 1, messages: [], state: { ...DEFAULT_STATE } };
  }

  const record = raw as Partial<StoredConversation>;
  return {
    version: 1,
    messages: Array.isArray(record.messages) ? record.messages : [],
    state: {
      ...DEFAULT_STATE,
      ...(record.state ?? {}),
    },
  };
}

export async function loadConversation(conversationId?: string) {
  if (!conversationId) {
    const created = await prisma.aIConversation.create({
      data: {
        messages: {
          version: 1,
          messages: [],
          state: DEFAULT_STATE,
        } as Prisma.InputJsonValue,
      },
    });
    return { id: created.id, stored: normalizeStored(created.messages) };
  }

  const existing = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
  });

  if (!existing) {
    const created = await prisma.aIConversation.create({
      data: {
        messages: {
          version: 1,
          messages: [],
          state: DEFAULT_STATE,
        } as Prisma.InputJsonValue,
      },
    });
    return { id: created.id, stored: normalizeStored(created.messages) };
  }

  return { id: existing.id, stored: normalizeStored(existing.messages) };
}

export async function saveConversation(
  conversationId: string,
  stored: StoredConversation,
): Promise<void> {
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { messages: stored as Prisma.InputJsonValue },
  });
}

export function setDraft(
  state: ConversationState,
  draft: CampaignDraft,
): ConversationState {
  return {
    ...state,
    draft,
    awaitingConfirmation: true,
    confirmed: false,
  };
}

export function markConfirmed(state: ConversationState): ConversationState {
  return { ...state, confirmed: true, awaitingConfirmation: false };
}

export function clearConfirmation(state: ConversationState): ConversationState {
  return { ...state, confirmed: false, awaitingConfirmation: false, draft: undefined };
}
