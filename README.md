# Olive Living — Design & Project Management Dashboard

Internal dashboard for Olive Living's Design & Project Management team. It tracks hospitality projects end-to-end — owner onboarding, document collection, AI-generated feasibility studies, floor plans, investment tracking, owner communications, BD team accountability, and portfolio projections — behind an @oliveliving.com-only login.

> **TESTER MODE is active.** All email flows are simulated. Every send, without exception, routes **From: theopenhotels@gmail.com → To: akashsakhrani05@gmail.com** — preview-only, nothing is actually dispatched. See [docs/EMAIL_TESTING.md](docs/EMAIL_TESTING.md).

## Features

1. **Portfolio dashboard** — live stats and a five-stage pipeline (Active → Feasibility → Design → Execution → Complete) across all projects.
2. **Project workspace** — eight tabs per project: Overview, Documents, Feasibility, Floor Plans, Investment, Communications, Tasks, Projections.
3. **Document management** — drag-and-drop upload, client/internal split, five categories (Agreement, Permit, Survey, Specification, Reference), automatic key-info extraction.
4. **AI feasibility studies** — auto-generated after document upload: executive summary, phased timeline, risk analysis, cost breakdown, recommendations. Regenerate on demand.
5. **Floor plans** — versioned 2D SVG plans plus an interactive 3D viewer (three.js), room dimensions, materials, and PDF export.
6. **Investment requirements** — cost breakdown, estimated ROI, payment schedule, and owner-approval tracking per project.
7. **Owner communication hub** — full communication log with branded Olive Living HTML email previews for every owner-facing send.
8. **BD team accountability** — kanban task board with drag-and-drop status changes, priorities, due dates, and per-member completion metrics (daily tracker via n8n).
9. **Portfolio projections** — Timeline / Budget / ROI / Risk projections rendered with Recharts, generated weekly (n8n) or on demand.
10. **Security & audit** — three-layer @oliveliving.com enforcement, HMAC-signed sessions, rate limiting, and an audit log of every significant action.

## Tech stack

- **Next.js 14 (App Router) + TypeScript** — UI and API routes in one deployable
- **Tailwind CSS + Framer Motion** — styling and animation
- **Recharts** (projections/charts) and **three.js** (3D floor plans)
- **TanStack Query + Zustand** — server state and client state
- **Data layer** — in-memory mock store in tester mode; **Supabase** (Postgres + RLS) in production mode
- **n8n** — five automation workflows (DD-1 … DD-5), currently inactive
- **Vercel** — hosting, auto-deploy from GitHub

## Quickstart

```bash
npm install
cp .env.example .env.local   # tester-mode defaults are already correct
npm run dev                   # http://localhost:3000
```

**Login (tester mode):** any `@oliveliving.com` email + any password of 8+ characters, e.g. `harshit.s@oliveliving.com` / `password123`. No signup needed — auth is mocked in tester mode (Supabase Auth arrives with production cutover).

Requires **Node.js 18+**.

## Tester mode

`NEXT_PUBLIC_TESTER_MODE=true` and `NEXT_PUBLIC_MOCK_EMAIL_SEND=true` (see `.env.local`). In this mode:

- Data is served from an in-memory mock store seeded with 5 realistic Olive Living projects (mirroring `database/seed-data.sql`).
- **All emails route From theopenhotels@gmail.com → To akashsakhrani05@gmail.com, preview-only — nothing is ever dispatched.** Enforced in `src/lib/email.ts` (`resolveEmailRouting()`) and locked in the Email Preview modal. No other address is ever used.
- "Send" actions log a communication record and an audit entry, then return the email preview.

## Project structure

```
design-dashboard-app/
├── database/
│   ├── schema.sql          # 9 tables + RLS (already applied to Supabase)
│   └── seed-data.sql       # 5 sample projects (already applied)
├── docs/                   # setup, API, deployment, email testing, troubleshooting
├── src/
│   ├── app/                # App Router pages + /api routes
│   ├── components/         # common/, layout/, modals/, feature components
│   ├── context/            # AuthContext
│   ├── lib/                # constants, email routing, supabase, mock store, n8n, auth
│   ├── styles/             # globals.css
│   ├── types/              # domain types (mirror schema.sql)
│   └── middleware.ts       # Edge security middleware
├── tests/                  # manual QA checklist
├── .env.example
├── vercel.json             # security headers
└── package.json
```

## Documentation

| Doc | What it covers |
| --- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Local setup, env vars, Supabase state, n8n, remaining user actions |
| [docs/API.md](docs/API.md) | Every API endpoint: methods, bodies, responses |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | GitHub → Vercel flow, env vars, production cutover |
| [docs/EMAIL_TESTING.md](docs/EMAIL_TESTING.md) | The tester email contract — read before touching send flows |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [tests/README.md](tests/README.md) | Manual QA checklist |

## Security summary

- **Layer 1 — client:** login form validates @oliveliving.com + 8-char minimum password.
- **Layer 2 — Edge middleware** (`src/middleware.ts`): HMAC-SHA256-signed `httpOnly`/`Secure`/`SameSite` session cookie, 30-minute sliding inactivity logout, 50 req/min/user rate limit on `/api/*`, domain re-checked on every request.
- **Layer 3 — API routes:** per-route `requireSession()` revalidation.
- **Database:** RLS `org_isolation` policy on all 9 tables — JWT email must end in `@oliveliving.com`.
- **Headers:** HSTS, `X-Frame-Options: DENY`, `nosniff`, and a restrictive CSP via `vercel.json`.

## Cost

**$0.** Vercel Hobby, Supabase free tier, n8n free tier — no paid services anywhere in the stack.

## Antigravity IDE

This repository is structured for Antigravity IDE integration — conventional Next.js layout, single-source constants (`src/lib/constants.ts`), and self-describing docs so agentic tooling can navigate and extend it safely.
