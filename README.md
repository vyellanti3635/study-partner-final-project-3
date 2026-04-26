# StudyPartner

A session-authenticated single-page web application for college students to manage academic tasks across multiple subjects.

Built as a Westcliff University project (Project 3).

## Live Demo

- **Live URL:** https://project3-study-partner.onrender.com
- **GitHub:** https://github.com/vyellanti3635/project3-study-partner

Note: Render's free tier sleeps after 15 minutes of inactivity. The first request after a sleep takes about 30 seconds to spin the service back up; subsequent requests are fast.

## Features

- Sign up, log in, log out with session-based authentication (express-session + cookies + bcrypt)
- Create, read, update, delete tasks scoped to your account
- Group tasks by subject (case-insensitive deduplication)
- Filter, search, sort, and paginate tasks (server-side, page size 6)
- Dashboard with stat cards, "Due Today", weekly progress per subject, and upcoming tasks
- Edit profile (name, email with password confirmation) and change password
- Installable Progressive Web App with offline shell
- Responsive across mobile, tablet, desktop

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, React Router v6, React Query, react-hook-form, Zod, Bootstrap 5, SASS modules |
| Backend | Node 20, Express 4, TypeScript, Mongoose 8, express-session, connect-mongo, bcrypt, helmet, pino, express-rate-limit, mongo-sanitize |
| Database | MongoDB Atlas (M0 free tier) |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | Render (web service) — same-origin: Express serves the React build |

## Architecture

Same-origin in production: one Render web service runs Express, which serves both the API at `/api/*` and the built React bundle for everything else. No CORS in production.

In development, Vite dev server proxies `/api/*` to Express on port 4000.

```
Production (single origin)
  Browser  ─── HTTPS ───►  Render Web Service
                              ├── /api/*       Express
                              └── /*           React build (client/dist)
                                                    │
                                                    └─► MongoDB Atlas

Development (two ports)
  Browser  ─── http://localhost:5174 ───►  Vite (React)
                  └── /api/* proxy ─────►  Express (4000)
                                              │
                                              └─► MongoDB Atlas
```

## Local Development

### Prerequisites
- Node 20 (`.nvmrc` pins this)
- npm 10
- MongoDB Atlas account (free M0 cluster)

### Setup

```bash
# Clone
git clone https://github.com/vyellanti3635/project3-study-partner.git
cd project3-study-partner

# Install all workspaces
npm install

# Configure server env
cp server/.env.example server/.env
# Edit server/.env with your Atlas connection string and a 32+ char SESSION_SECRET
```

Generate a `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run dev mode (hot reload, two ports)

```bash
npm run dev
```

- Frontend: http://localhost:5174 (or next available port)
- Backend: http://localhost:4000

### Run production build locally (single port)

```bash
npm run build
NODE_ENV=production LOCAL_HTTP_TEST=1 npm start
# Visit http://localhost:4000
```

The `LOCAL_HTTP_TEST=1` flag drops the `Secure` cookie attribute so sessions work over HTTP. Do NOT set this on Render (HTTPS is live there).

## Project Structure

```
project3-study-partner/
├── client/                     React + Vite frontend
│   ├── public/icons/           PWA icons (192, 512, 512 maskable)
│   ├── src/
│   │   ├── api/                Axios client + endpoint modules
│   │   ├── auth/               AuthContext, ProtectedRoute, PublicOnlyRoute
│   │   ├── components/         FormField, Toast, Pagination, TaskForm, Navbar, EmptyState
│   │   ├── hooks/              useDebounce, useToast, useTasks, useSubjects
│   │   ├── pages/              Landing, Signup, Login, Dashboard, MyTasks, AddTask, EditTask, Profile
│   │   ├── schemas/            Shared Zod validators (mirrored on server)
│   │   └── styles/             Design tokens, mixins, Bootstrap overrides
│   └── vite.config.ts          PWA + dev proxy config
├── server/                     Express + Mongoose backend
│   └── src/
│       ├── config/             env, db
│       ├── controllers/        auth, tasks, subjects, user
│       ├── middleware/         requireAuth, validate, rateLimit, session, errorHandler, notFound
│       ├── models/             User, Task, Subject
│       ├── routes/             auth, tasks, subjects, user
│       └── schemas/            Shared Zod validators (mirrored on client)
├── docs/wireframes/            Design references (archived from initial proposal)
├── .kiro/specs/study-partner/  Spec docs (requirements, design, tasks)
└── package.json                Root workspace
```

## API

All responses follow the envelope `{ success, data, error, meta }`. Authenticated routes require a session cookie (`sp.sid`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/signup | no | Create account, log in |
| POST | /api/auth/login | no | Log in (rate limited 10/15min) |
| POST | /api/auth/logout | yes | Destroy session |
| GET | /api/auth/me | no | Current user or null |
| GET | /api/subjects | yes | List user's subjects |
| POST | /api/subjects | yes | Create subject (idempotent on case-insensitive name) |
| GET | /api/tasks | yes | List with filters, search, sort, pagination |
| POST | /api/tasks | yes | Create task |
| GET | /api/tasks/:id | yes | Single task |
| PATCH | /api/tasks/:id | yes | Update or toggle complete |
| DELETE | /api/tasks/:id | yes | Delete task |
| GET | /api/tasks/stats | yes | Dashboard counters + weekly progress |
| GET | /api/tasks/today | yes | Today's open tasks |
| GET | /api/tasks/upcoming | yes | Next 5 future open tasks |
| GET | /api/user/profile | yes | Get profile |
| PATCH | /api/user/profile | yes | Update name and/or email (email change requires currentPassword) |
| PATCH | /api/user/password | yes | Change password |

## Deployment (Render)

Render auto-deploys from the `main` branch on push.

**Build command:** `npm install && npm run build`

**Start command:** `npm start`

**Required env vars:**

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `SESSION_SECRET` | A 32+ char random hex string |

`PORT` is injected by Render automatically.

Atlas Network Access must allow `0.0.0.0/0` because Render's free tier has dynamic egress IPs.

## Security

- Passwords hashed with bcrypt (cost 12)
- Session cookies are `httpOnly`, `secure` in production, `sameSite: lax`, 7-day rolling expiry
- Helmet middleware sets standard security headers
- Login endpoint rate limited (10 attempts / 15 minutes per IP)
- Generic error message on login failure (anti-enumeration)
- Cross-user record access returns 404, never 403 (anti-enumeration)
- mongo-sanitize blocks NoSQL operator injection
- Server-side input validation with Zod on every mutation endpoint
- TLS terminated by Render (HSTS via helmet)

## Scripts

| Command | Effect |
|---|---|
| `npm install` | Install all workspaces |
| `npm run dev` | Run both client and server in watch mode |
| `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Express dev server only |
| `npm run build` | Build client and server for production |
| `npm start` | Run compiled server (also serves client/dist) |

## Submission

- GitHub: https://github.com/vyellanti3635/project3-study-partner
- Live: https://project3-study-partner.onrender.com

Submitted in Module 6 dropbox of the Westcliff GAP portal.
