import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { AppError } from '../utils/errors.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }

  // Custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // JWT errors
  if (error.message?.includes('jwt') || error.message?.includes('unauthorized')) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Generic error
  return reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal Server Error',
  });
}
