import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { chatRequestSchema, handleChatRequest } from "../ai/chat-handler.js";
import { AppError } from "../middleware/error-handler.js";

function mapAiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/quota|rate limit|retry in/i.test(msg)) {
    return "Gemini free-tier rate limit reached — wait a minute and try again.";
  }
  if (/expired|renew your api key/i.test(msg)) {
    return "Gemini API key expired — create a new key at aistudio.google.com/apikey";
  }
  if (/api key not valid|API_KEY_INVALID/i.test(msg)) {
    return "Invalid Gemini API key — check GEMINI_API_KEY in .env";
  }
  if (/api key|gemini/i.test(msg)) {
    return msg;
  }
  return "AI request failed — try again in a moment";
}

export async function aiChatRoutes(app: FastifyInstance) {
  app.post("/chat", async (request, reply) => {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      throw new AppError(
        503,
        "AI chat is unavailable — GEMINI_API_KEY not configured",
        "AI_UNAVAILABLE",
      );
    }

    let body;
    try {
      body = chatRequestSchema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          "Invalid chat payload — could not parse messages",
          "CHAT_PARSE_ERROR",
        );
      }
      throw error;
    }

    try {
      const { conversationId, result, onFinish } = await handleChatRequest(body);

      const response = result.toUIMessageStreamResponse({
        originalMessages: body.messages,
        onFinish: async ({ messages }) => {
          await onFinish(messages);
        },
        onError: (error) => mapAiError(error),
      });

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      reply.header("X-Conversation-Id", conversationId);

      return reply.send(response.body);
    } catch (error) {
      request.log.error(error);
      throw new AppError(502, mapAiError(error), "AI_STREAM_ERROR");
    }
  });
}
