# Setup Guide

## 1. Local development

```bash
git clone https://github.com/olive-lead-digest/design-dashboard.git   # or use the existing local folder
cd design-dashboard-app
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

- **Node.js 18+** required (Next.js 14).
- Tester-mode defaults in `.env.example` are correct as-is — the app runs entirely on the in-memory mock store, so you can develop without Supabase or n8n reachable.
- **Login:** any `@oliveliving.com` email + any 8+ character password.
- Restart the dev server after changing any `.env.local` value (Next.js inlines `NEXT_PUBLIC_*` at build time).

## 2. Environment variables

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://fwzdhmobfcwsspobrvdl.supabase.co` (Supabase dashboard → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key — safe for the client, RLS-scoped | `sb_publishable_Tew7PK8cmOhGW3VxMQjUBQ_fZD_XONQ` (dashboard → API Keys) |
| `SUPABASE_SERVICE_KEY` | Server-only key that bypasses RLS (API routes, n8n) | Supabase dashboard → API Keys → `service_role`. **Copy into Vercel env only — never into code or git.** |
| `N8N_API_KEY` | Server-to-n8n webhook auth | Your n8n instance → Settings → API |
| `SESSION_SECRET` | HMAC key for signing session cookies | Generate: `openssl rand -base64 48` |
| `ALLOWED_EMAIL_DOMAIN` | Login domain allowlist | `@oliveliving.com` |
| `NEXT_PUBLIC_TESTER_MODE` | Master tester-mode switch (mock store, mock auth, locked email routing) | `true` for the current phase |
| `NEXT_PUBLIC_MOCK_EMAIL_SEND` | Forces preview-only email behavior | `true` for the current phase |
| `NEXT_PUBLIC_TEST_DATA_ENABLED` | Seeds the mock store with the 5 sample projects | `true` for the current phase |
| `NEXT_PUBLIC_TEST_SENDER_EMAIL` | The only From address in tester mode | `theopenhotels@gmail.com` (fixed) |
| `NEXT_PUBLIC_TEST_RECEIVER_EMAIL` | The only To address in tester mode | `akashsakhrani05@gmail.com` (fixed) |

Secrets live in `.env.local` locally and in Vercel project settings for deploys — never in code or git (`.env.local` is gitignored).

## 3. Supabase — current state (already applied)

The build already provisioned and seeded the database. Nothing to run for normal use.

| Item | Value |
| --- | --- |
| Organization | theopenhotels@gmail.com's Org (`erkqiecxfrvcxvnsddjl`) |
| Project | `olive-design-projects-tester` (ref `fwzdhmobfcwsspobrvdl`) |
| URL | `https://fwzdhmobfcwsspobrvdl.supabase.co` |
| Region | `ap-south-1` (Mumbai) |
| Tables | 9 new: `projects`, `documents`, `feasibility_studies`, `floor_plans`, `investment_requirements`, `communications`, `team_tasks`, `projections`, `audit_logs` — created **alongside** the pre-existing `dp_*` tables, which are untouched |
| RLS | Enabled on all 9 tables with policy `org_isolation`: `(auth.jwt() ->> 'email') LIKE '%@oliveliving.com'`. `service_role` bypasses RLS by design (server/n8n). |
| Seed data | 5 sample Olive Living projects with documents, feasibility studies, floor plans, investments, communications, tasks, projections |

**Re-applying from scratch** (only if the project is ever recreated): open Supabase dashboard → SQL Editor, paste and run `database/schema.sql`, then `database/seed-data.sql`. Both are idempotent (`create table if not exists`, `on conflict do nothing`), so re-running is safe.

## 4. n8n workflows

Five workflows exist, created **INACTIVE** — they do nothing until you activate them:

| Workflow | Trigger |
| --- | --- |
| DD-1 Feasibility Study Generator | Webhook `feasibility-generator` |
| DD-2 Floor Plan Generator | Webhook `floor-plan-generator` |
| DD-3 Communication Logger | Webhook `communication-logger` |
| DD-4 Task Accountability Tracker | Schedule — daily 09:00 IST |
| DD-5 Projections Generator | Schedule — weekly Mon 09:00 IST + webhook |

None of the five contains an email node — see [EMAIL_TESTING.md](EMAIL_TESTING.md).

**Credential repoint (required before activating):** the Supabase credential `dsZvYaB5av1RwbxL` currently points at an older project.

1. In n8n: Credentials → open credential `dsZvYaB5av1RwbxL`.
2. Set Host/URL to `https://fwzdhmobfcwsspobrvdl.supabase.co`.
3. Replace the key with this project's `service_role` key (Supabase dashboard → API Keys).
4. Save and use "Test" if available; the Anthropic credential `mXPwb5lEbxPFmxDt` needs no change.
5. When ready to leave tester mode, open each workflow DD-1 … DD-5 and toggle **Active**.

## 5. Remaining user actions (checklist)

- [ ] **Set Vercel env vars** (Production + Preview) — all 11 variables from the table above; see [DEPLOYMENT.md](DEPLOYMENT.md).
- [ ] **Push to GitHub** — the local folder is already git-initialized:
  ```bash
  cd ~/Desktop/design-dashboard-app
  git remote add origin https://github.com/olive-lead-digest/design-dashboard.git
  git push -u origin main
  ```
- [ ] **Repoint the n8n Supabase credential** `dsZvYaB5av1RwbxL` to `https://fwzdhmobfcwsspobrvdl.supabase.co` with its `service_role` key (steps above).
- [ ] **Activate workflows DD-1 … DD-5** in n8n when ready (they are intentionally inactive during tester mode).
- [ ] **Rotate `SESSION_SECRET`** — set a fresh long random value in Vercel (and `.env.local`) rather than keeping any placeholder; rotate again at production cutover.
