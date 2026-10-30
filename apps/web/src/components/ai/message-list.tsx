"use client";

import type { UIMessage } from "ai";

function messageText(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function MessageList({
  messages,
  isLoading,
}: {
  messages: UIMessage[];
  isLoading?: boolean;
}) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Ask me to target a segment, draft a message, or review campaign
          performance.
        </p>
      ) : null}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-[90%] rounded-lg px-4 py-3 text-sm ${
            message.role === "user"
              ? "ml-auto bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-900"
          }`}
        >
          <p className="whitespace-pre-wrap">{messageText(message)}</p>
          {message.parts
            ?.filter((part) => part.type.startsWith("tool-"))
            .map((part, index) => (
              <p
                key={`${message.id}-tool-${index}`}
                className="mt-2 text-xs opacity-70"
              >
                Tool: {part.type.replace("tool-", "")}
              </p>
            ))}
        </div>
      ))}

      {isLoading ? (
        <div className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
          Thinking…
        </div>
      ) : null}
    </div>
  );
}
