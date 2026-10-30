import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten(),
      },
    });
  }

  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.validation,
      },
    });
  }

  request.log.error(error);

  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
    },
  });
}

export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.status(404).send({
    error: {
      code: "NOT_FOUND",
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
}
