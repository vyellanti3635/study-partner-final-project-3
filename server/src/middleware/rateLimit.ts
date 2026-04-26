import rateLimit from 'express-rate-limit';
import { err } from '../lib/apiResponse';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(err('Too many attempts. Please try again in 15 minutes.'));
  },
});
