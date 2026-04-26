import path from 'path';
import express, { Application } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './lib/logger';
import { sessionMiddleware } from './middleware/session';
import authRouter from './routes/auth.routes';
import subjectsRouter from './routes/subjects.routes';
import tasksRouter from './routes/tasks.routes';
import userRouter from './routes/user.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// In the compiled output, __dirname resolves to server/dist/
// so two levels up lands at the repo root, then into client/dist/
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp(): Application {
  const app = express();

  // Trust the first proxy in production (Render load balancer)
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security headers
  app.use(
    helmet({
      hsts:
        env.NODE_ENV === 'production'
          ? { maxAge: 15552000, includeSubDomains: true }
          : false,
    })
  );

  // Request logging
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Strip MongoDB query operators from user input
  app.use(mongoSanitize());

  // CORS in development only (Vite proxy handles same-origin in dev;
  // production is single-origin so no CORS needed)
  if (env.NODE_ENV === 'development') {
    app.use(
      cors({
        origin: env.CLIENT_ORIGIN ?? 'http://localhost:5173',
        credentials: true,
      })
    );
  }

  // Session middleware (connect-mongo persists sessions in Atlas)
  app.use(sessionMiddleware);

  // Auth routes
  app.use('/api/auth', authRouter);

  // Subjects routes
  app.use('/api/subjects', subjectsRouter);

  // Tasks routes (includes /today, /upcoming, /stats, and CRUD /:id)
  app.use('/api/tasks', tasksRouter);

  // User profile routes
  app.use('/api/user', userRouter);

  // In production: serve the built React bundle and add the SPA fallback.
  // In development: Vite handles the client; Express only serves the API.
  if (env.NODE_ENV === 'production') {
    // Serve hashed static assets (JS/CSS bundles) with a long-lived cache.
    // The Vite build fingerprints filenames, so content-addressing is safe.
    app.use(
      express.static(CLIENT_DIST, {
        maxAge: '1y',
        etag: true,
        // Do NOT long-cache: index.html, service worker, or workbox runtime.
        // These must always be re-fetched so PWA updates are detected promptly.
        // Hashed asset bundles in assets/ are safe for long-term caching.
        setHeaders(res, filePath) {
          const name = path.basename(filePath);
          const isNonCacheable =
            name === 'index.html' ||
            name === 'sw.js' ||
            name.startsWith('workbox-');
          if (isNonCacheable) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );

    // 404 for unknown API routes only — the JSON envelope is what callers expect.
    app.use('/api', notFound);

    // SPA fallback: any non-API GET that didn't match a static file
    // (e.g. /app/dashboard, /signup) gets index.html so React Router handles it.
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  } else {
    // Development: global 404 for any unrecognised Express route.
    app.use(notFound);
  }

  // Central error handler must be last in all environments.
  app.use(errorHandler);

  return app;
}
