import type { SegmentDefinition } from "@xeno/shared";

export type InjectedChatContext = {
  goal?: string;
  segmentDefinition?: SegmentDefinition;
  messageTemplate?: string;
  channel?: string;
  segmentHint?: string;
  priorCampaignId?: string;
  rerun?: boolean;
  suggestedChannel?: string;
};

export function parseInjectedContext(raw: unknown): InjectedChatContext | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as InjectedChatContext;
}

export function buildInjectedContextPrompt(
  context: InjectedChatContext,
): string {
  const lines: string[] = [];

  if (context.rerun) {
    lines.push("User is re-running a prior campaign. Reuse segment and message unless they ask to change.");
  }

  if (context.goal) lines.push(`Goal: ${context.goal}`);
  if (context.segmentHint) lines.push(`Segment hint: ${context.segmentHint}`);
  if (context.channel || context.suggestedChannel) {
    lines.push(`Suggested channel: ${context.channel ?? context.suggestedChannel}`);
  }
  if (context.messageTemplate) {
    lines.push(`Message template: ${context.messageTemplate}`);
  }
  if (context.segmentDefinition) {
    lines.push(
      `Segment definition JSON: ${JSON.stringify(context.segmentDefinition)}`,
    );
  }
  if (context.priorCampaignId) {
    lines.push(`Prior campaign ID: ${context.priorCampaignId}`);
    lines.push(
      "Use getCampaignStats with this ID if performance context is needed.",
    );
  }

  return lines.join("\n");
}
