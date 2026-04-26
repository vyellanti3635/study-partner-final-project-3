import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { err } from '../lib/apiResponse';

export function validate(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join('.'),
          issue.message,
        ])
      );
      res.status(400).json(err('Validation failed', fields));
      return;
    }
    req.body = result.data;
    next();
  };
}
