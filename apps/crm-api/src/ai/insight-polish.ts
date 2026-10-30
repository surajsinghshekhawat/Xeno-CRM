import type { Insight } from "@xeno/shared";
import { getGeminiModel } from "./gemini.js";

const POLISH_TIMEOUT_MS = 2000;

export async function polishInsightMessage(insight: Insight): Promise<Insight> {
  if (!process.env.GEMINI_API_KEY?.trim()) return insight;

  try {
    const { generateText } = await import("ai");

    const polishPromise = generateText({
      model: getGeminiModel(),
      prompt: `You polish CRM dashboard insight copy for Thread & Co., an Indian fashion brand (casual but premium, en-IN).
Rewrite the insight below in 1-2 concise sentences. Keep numbers and facts exact. No markdown.

Title: ${insight.title}
Message: ${insight.message}`,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("polish_timeout")), POLISH_TIMEOUT_MS);
    });

    const { text } = await Promise.race([polishPromise, timeoutPromise]);
    const polished = text.trim();
    if (!polished) return insight;

    return {
      ...insight,
      polishedMessage: polished,
    };
  } catch {
    return insight;
  }
}
