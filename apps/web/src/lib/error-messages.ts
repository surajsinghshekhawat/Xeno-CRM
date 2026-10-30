export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.name === "ApiError") return error.message;
    if (/failed to fetch|network/i.test(error.message)) {
      return "Cannot reach the CRM API. Start it with pnpm dev and ensure NEXT_PUBLIC_CRM_API_URL is correct.";
    }
    return error.message || fallback;
  }
  return fallback;
}

export function formatChatError(error: Error | undefined): string | null {
  if (!error) return null;

  const message = error.message.toLowerCase();

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Cannot reach the AI service. Check that the CRM API is running.";
  }

  if (message.includes("quota") || message.includes("rate limit") || message.includes("retry in")) {
    return "Gemini free-tier rate limit reached. Wait a minute and try again, or check usage at ai.dev/rate-limit.";
  }

  if (message.includes("api key expired") || message.includes("renew the api key")) {
    return "Your Gemini API key was rejected as expired. Create a fresh key at aistudio.google.com/apikey, update GEMINI_API_KEY in .env, and restart pnpm dev.";
  }

  if (message.includes("api key not valid") || message.includes("api_key_invalid")) {
    return "Invalid Gemini API key. Copy your key from aistudio.google.com/apikey into GEMINI_API_KEY in .env, then restart pnpm dev.";
  }

  if (message.includes("ai unavailable") || message.includes("503")) {
    return "AI is unavailable — set GEMINI_API_KEY on the CRM API and restart.";
  }

  if (message.includes("validation") || message.includes("parse")) {
    return "I couldn't understand that request. Try rephrasing your campaign goal.";
  }

  if (message.includes("channel") || message.includes("stub")) {
    return "Channel service is unreachable. Campaign was saved but dispatch may be delayed — use Retry dispatch from the campaign detail page.";
  }

  return error.message || "Something went wrong. Please try again.";
}
