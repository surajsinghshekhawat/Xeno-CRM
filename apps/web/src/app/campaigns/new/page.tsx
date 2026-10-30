"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ChatPanel,
  extractSegmentPreview,
} from "@/components/ai/chat-panel";
import { LiveMetricsPanel } from "@/components/ai/live-metrics-panel";
import { SegmentPreview } from "@/components/ai/segment-preview";
import { API_BASE } from "@/lib/api-client";
import { apiGet } from "@/lib/api-client";

const PROACTIVE_MESSAGE =
  "I can help you launch a campaign — tell me your goal (e.g. win back lapsed customers, welcome new signups, or reward VIPs).";

function AiConsoleContent() {
  const searchParams = useSearchParams();
  const injectedContext = useMemo(() => {
    const raw = searchParams.get("context");
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }, [searchParams]);

  const [conversationId] = useState(() => crypto.randomUUID());
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const proactiveSent = useRef(false);
  const lastActivity = useRef(Date.now());

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_BASE}/api/ai/chat`,
        body: { context: injectedContext, id: conversationId },
      }),
    [injectedContext, conversationId],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: conversationId,
    transport,
  });

  const [input, setInput] = useState("");

  useEffect(() => {
    if (proactiveSent.current) return;
    proactiveSent.current = true;
    setMessages([
      {
        id: "proactive",
        role: "assistant",
        parts: [{ type: "text", text: PROACTIVE_MESSAGE }],
      },
    ]);
  }, [setMessages]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current < 180_000) return;
      lastActivity.current = Date.now();
      void apiGet<{ insight: { message: string } | null }>("/api/insights").then(
        (data) => {
          if (!data.insight) return;
          setMessages((prev) => [
            ...prev,
            {
              id: `insight-${Date.now()}`,
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: `Proactive insight: ${data.insight!.message}`,
                },
              ],
            },
          ]);
        },
      );
    }, 60_000);
    return () => clearInterval(timer);
  }, [setMessages]);

  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message?.role !== "assistant") continue;
      for (const part of message.parts ?? []) {
        if (part.type !== "tool-fireCampaign") continue;
        const output = part.output as { campaignId?: string } | undefined;
        if (output?.campaignId) {
          setActiveCampaignId(output.campaignId);
          return;
        }
      }
    }
  }, [messages]);

  const segmentPreview = extractSegmentPreview(messages);
  const isLoading = status === "streaming" || status === "submitted";

  const dispatchError = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message?.role !== "assistant") continue;
      for (const part of message.parts ?? []) {
        if (part.type !== "tool-fireCampaign") continue;
        const output = part.output as {
          dispatch?: { success?: boolean; message?: string };
          dispatchFailed?: boolean;
          message?: string;
        } | undefined;
        if (output?.dispatch && output.dispatch.success === false) {
          return (
            output.dispatch.message ??
            "Channel service is unreachable. The campaign was created — retry dispatch from the campaign page."
          );
        }
        if (output?.dispatchFailed && output.message) {
          return output.message;
        }
      }
    }
    return null;
  }, [messages]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <ChatPanel
          messages={messages}
          input={input}
          onInputChange={setInput}
          isLoading={isLoading}
          error={error}
          dispatchError={dispatchError}
          onSubmit={() => {
            if (!input.trim()) return;
            lastActivity.current = Date.now();
            void sendMessage({ text: input.trim() });
            setInput("");
          }}
        />
      </div>
      <div className="space-y-4 lg:col-span-2">
        <SegmentPreview data={segmentPreview} />
        <LiveMetricsPanel campaignId={activeCampaignId} />
      </div>
    </div>
  );
}

export default function AiCampaignConsolePage() {
  return (
    <AppShell
      title="AI Campaign Console"
      description="Chat-first campaign creation with live delivery tracking."
    >
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <AiConsoleContent />
      </Suspense>
    </AppShell>
  );
}
