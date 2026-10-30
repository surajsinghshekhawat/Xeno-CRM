"use client";

import type { UIMessage } from "ai";
import type { SegmentPreviewData } from "./segment-preview";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { formatChatError } from "@/lib/error-messages";

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  dispatchError,
}: {
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: Error;
  dispatchError?: string | null;
}) {
  const chatError = formatChatError(error);

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="font-semibold">Campaign assistant</h2>
        <p className="text-xs text-neutral-500">
          Chat-first campaign creation for Thread &amp; Co.
        </p>
      </div>
      <MessageList messages={messages} isLoading={isLoading} />
      {chatError ? (
        <p className="mx-4 mb-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {chatError}
        </p>
      ) : null}
      {dispatchError ? (
        <p className="mx-4 mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {dispatchError}
        </p>
      ) : null}      <ChatInput
        value={input}
        onChange={onInputChange}
        onSubmit={onSubmit}
        disabled={isLoading}
      />
    </div>
  );
}

export function extractSegmentPreview(
  messages: UIMessage[],
): SegmentPreviewData | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    for (const part of message.parts ?? []) {
      if (part.type !== "tool-getCustomerSegment") continue;
      const output = part.output as SegmentPreviewData | undefined;
      if (output?.customers) return output;
    }
  }
  return null;
}
