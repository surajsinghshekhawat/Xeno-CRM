import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { detectUserApproval } from "./confirmation.js";
import {
  buildInjectedContextPrompt,
  parseInjectedContext,
} from "./context-injection.js";
import {
  clearConfirmation,
  loadConversation,
  markConfirmed,
  saveConversation,
  setDraft,
  type CampaignDraft,
  type StoredConversation,
} from "./conversation-state.js";
import { getGeminiModel } from "./gemini.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { createAiTools } from "./tools/index.js";

export const chatRequestSchema = z.object({
  id: z.string().uuid().optional(),
  messages: z.array(z.custom<UIMessage>()),
  context: z.unknown().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

function latestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "user") continue;
    const text = message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");
    if (text) return text;
  }
  return "";
}

function extractDraftFromToolResults(
  messages: UIMessage[],
): CampaignDraft | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    for (const part of message.parts ?? []) {
      if (part.type !== "tool-fireCampaign") continue;
      const output = part.output as { draft?: CampaignDraft } | undefined;
      if (output?.draft) return output.draft;
    }
  }
  return undefined;
}

export async function handleChatRequest(body: ChatRequest) {
  const { id, messages, context } = chatRequestSchema.parse(body);
  const { id: conversationId, stored } = await loadConversation(id);

  let state = { ...stored.state };
  const approval = detectUserApproval(latestUserText(messages));

  if (approval === "approve" && state.awaitingConfirmation) {
    state = markConfirmed(state);
  } else if (approval === "reject") {
    state = clearConfirmation(state);
  }

  const injected = parseInjectedContext(context);
  const contextPrompt = injected ? buildInjectedContextPrompt(injected) : undefined;
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getGeminiModel(),
    system: buildSystemPrompt(contextPrompt),
    messages: modelMessages,
    tools: createAiTools({ serverConfirmed: state.confirmed }),
    stopWhen: stepCountIs(5),
    abortSignal: AbortSignal.timeout(60_000),
  });

  return {
    conversationId,
    result,
    onFinish: async (finalMessages: UIMessage[]) => {
      let nextState = state;
      const draft = extractDraftFromToolResults(finalMessages);
      if (draft) {
        nextState = setDraft(nextState, draft);
      }

      const launched = finalMessages.some((message) =>
        message.parts?.some(
          (part) =>
            part.type === "tool-fireCampaign" &&
            typeof part.output === "object" &&
            part.output !== null &&
            "campaignId" in (part.output as object),
        ),
      );
      if (launched) {
        nextState = clearConfirmation(nextState);
      }

      const nextStored: StoredConversation = {
        version: 1,
        messages: finalMessages,
        state: nextState,
      };
      await saveConversation(conversationId, nextStored);
    },
  };
}
