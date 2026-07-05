# Deployment Guide

## Overview

```
local repo ──git push──▶ GitHub (olive-lead-digest/design-dashboard, main)
                              │  auto-deploy
                              ▼
        Vercel production: https://design-dashboard-prod-52lqvpi26-olive-hospitality.vercel.app
```

Every push to `main` triggers a production deploy; pushes to other branches / PRs get preview deployments. Total infrastructure cost: **$0** (Vercel Hobby + Supabase free tier + n8n free tier).

## 1. Push to GitHub

The local folder is already git-initialized with the full history. Connect it to the repo and push (user action):

```bash
cd ~/Desktop/design-dashboard-app
git remote add origin https://github.com/olive-lead-digest/design-dashboard.git
git push -u origin main
```

`.env.local` is gitignored — verify with `git status` before your first push that no secrets are staged.

## 2. Environment variables in Vercel

Vercel dashboard → project → **Settings → Environment Variables**. Add each variable below to **both Production and Preview** environments, then redeploy (env changes only apply to new builds):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fwzdhmobfcwsspobrvdl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_Tew7PK8cmOhGW3VxMQjUBQ_fZD_XONQ` |
| `SUPABASE_SERVICE_KEY` | Copy from Supabase dashboard → API Keys → `service_role` (**Vercel only, never git**) |
| `N8N_API_KEY` | From your n8n instance settings |
| `SESSION_SECRET` | Long random string, e.g. output of `openssl rand -base64 48` |
| `ALLOWED_EMAIL_DOMAIN` | `@oliveliving.com` |
| `NEXT_PUBLIC_TESTER_MODE` | `true` (current phase) |
| `NEXT_PUBLIC_MOCK_EMAIL_SEND` | `true` (current phase) |
| `NEXT_PUBLIC_TEST_DATA_ENABLED` | `true` (current phase) |
| `NEXT_PUBLIC_TEST_SENDER_EMAIL` | `theopenhotels@gmail.com` |
| `NEXT_PUBLIC_TEST_RECEIVER_EMAIL` | `akashsakhrani05@gmail.com` |

## 3. Security headers (`vercel.json`)

Applied to every response (`source: "/(.*)"`):

- **`Strict-Transport-Security: max-age=31536000; includeSubDomains`** — browsers refuse plain-HTTP connections for a year, blocking downgrade attacks.
- **`X-Content-Type-Options: nosniff`** — stops MIME-type sniffing (e.g. a "document" being executed as script).
- **`X-Frame-Options: DENY`** — the dashboard can never be iframed, preventing clickjacking.
- **`Content-Security-Policy`** — scripts/styles from self only (plus inline for Next.js/Tailwind runtime), fonts from Google Fonts, images from self/data/blob/https, and network connections restricted to self + `https://*.supabase.co`. Any exfiltration attempt to another origin is blocked by the browser.

If you add a new external service (analytics, another API), you must extend `connect-src` in `vercel.json` or the browser will silently block it.

## 4. Branch protection (recommended)

GitHub → repo → Settings → Branches → add a rule for `main`:

- Require a pull request before merging (at least 1 approval).
- Require status checks to pass (Vercel preview build).
- Block force pushes and deletions.

Since `main` deploys straight to production, this is the only gate between a typo and a live deploy.

## 5. Production cutover (leaving tester mode)

> **WARNING — this is the step where real property owners start receiving emails.** Until every box below is checked, keep `NEXT_PUBLIC_TESTER_MODE=true`. There is no undo for a wrongly-sent owner email.

**Pre-cutover checklist — complete ALL of these first:**

- [ ] Full manual QA pass ([tests/README.md](../tests/README.md)) is green on the tester deployment.
- [ ] Every `owner_email` in the `projects` table is verified correct — these become live recipients.
- [ ] Supabase Auth is wired in (replacing mock login): @oliveliving.com-restricted sign-in, JWTs flowing so the RLS `org_isolation` policy applies to client reads.
- [ ] Real SMTP is configured **via n8n** (email nodes added to the send workflows with production credentials) — the app itself still never talks SMTP directly.
- [ ] n8n Supabase credential `dsZvYaB5av1RwbxL` repointed to `https://fwzdhmobfcwsspobrvdl.supabase.co` with its `service_role` key, and DD-1 … DD-5 activated and test-executed.
- [ ] `SESSION_SECRET` rotated to a fresh value in Vercel.
- [ ] A deliberate test send has been reviewed by a human in the Email Preview modal.

**Cutover steps (Vercel env, Production):**

1. Set `NEXT_PUBLIC_TESTER_MODE=false`
2. Set `NEXT_PUBLIC_MOCK_EMAIL_SEND=false`
3. Set `NEXT_PUBLIC_TEST_DATA_ENABLED=false`
4. Add `PRODUCTION_SENDER_EMAIL=<your verified sending address>` — `resolveEmailRouting()` uses this as From in production
5. Redeploy. **From this deploy onward, send actions email real project owners** (`projects.owner_email`).

**Rollback:** flip `NEXT_PUBLIC_TESTER_MODE=true` and `NEXT_PUBLIC_MOCK_EMAIL_SEND=true`, redeploy — all routing instantly returns to `theopenhotels@gmail.com → akashsakhrani05@gmail.com` preview-only.
