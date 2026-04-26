import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from '../config/env';

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;
const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000;

export const sessionMiddleware = session({
  name: 'sp.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: env.MONGO_URI,
    collectionName: 'sessions',
    ttl: SEVEN_DAYS_SECONDS,
    touchAfter: 60,
  }),
  cookie: {
    httpOnly: true,
    // In production (Render), TLS is terminated at the load balancer so we
    // require secure cookies. For local prod-mode smoke tests over plain HTTP,
    // set LOCAL_HTTP_TEST=1 to disable the secure flag temporarily.
    // On Render: NODE_ENV=production and LOCAL_HTTP_TEST is unset → secure: true.
    secure:
      env.NODE_ENV === 'production' &&
      process.env.LOCAL_HTTP_TEST !== '1',
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  },
});
