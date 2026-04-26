import { RequestHandler } from 'express';
import { err } from '../lib/apiResponse';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(err('Not found'));
};
