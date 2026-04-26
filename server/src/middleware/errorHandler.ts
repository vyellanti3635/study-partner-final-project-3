import { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/httpErrors';
import { err } from '../lib/apiResponse';
import { logger } from '../lib/logger';

function mapMongooseErrors(error: {
  errors: Record<string, { message: string }>;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(error.errors).map(([key, val]) => [key, val.message])
  );
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error({ err: error }, 'AppError 5xx');
    }
    return res
      .status(error.status)
      .json(err(error.message, error.fields));
  }

  if (error.name === 'ValidationError') {
    const fields = mapMongooseErrors(error as {
      errors: Record<string, { message: string }>;
    });
    return res.status(400).json(err('Validation failed', fields));
  }

  if ((error as { code?: number }).code === 11000) {
    return res.status(409).json(err('Resource already exists'));
  }

  logger.error({ err: error, path: req.path, method: req.method }, 'unhandled error');
  return res.status(500).json(err('Something went wrong'));
};
