import { RequestHandler } from 'express';
import { err } from '../lib/apiResponse';

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json(err('Authentication required'));
    return;
  }
  next();
};
