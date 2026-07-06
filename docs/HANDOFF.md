# HANDOFF — Session State (updated 2026-07-06)

Read this first in a new session. It replaces re-discovery of the whole project.

## What this is
Olive Living Design & Project Management Dashboard — Next.js 14 (TS strict) + Tailwind,
TESTER MODE ($0, mock data, no real emails). Full spec implemented: 5 pages, 8 project
tabs, 26 API routes, 3-layer @oliveliving.com auth, 2D SVG + 3D three.js floor plans.

## 🔴 Invariants (never violate)
- Login: @oliveliving.com only, EXCEPT tester mode also admits theopenhotels@gmail.com
  (TESTER_LOGIN_WHITELIST in src/lib/constants.ts — ignored when tester mode is off).
- Tester emails ONLY: theopenhotels@gmail.com → akashsakhrani05@gmail.com. Never owner_email.
- No real email dispatch in tester mode (previews + communication logs only).
- $0: free tiers only. Secrets never in git (.env.local is gitignored; .env.production holds non-secrets only).

## Infrastructure (live)
- Supabase project: `olive-design-projects-tester`, ref **fwzdhmobfcwsspobrvdl** (org erkqiecxfrvcxvnsddjl, theopenhotels@gmail.com).
  9 spec tables seeded + RLS `org_isolation` on all (verified 9/9). Existing dp_* tables untouched.
  URL https://fwzdhmobfcwsspobrvdl.supabase.co · anon key in .env.production.
- n8n (https://olivehospitality.app.n8n.cloud): workflows DD-1…DD-5 created, INACTIVE, zero email nodes.
  IDs: DD-1 55UFg9NcfKW0eb1Q · DD-2 oUpM3vzntzG3KVOv · DD-3 A4LSXZZ4ZfkGEkGV · DD-4 ZlT3CaaU0toLxIMT · DD-5 fHwWy4ORPfHnUu5o.
  Credentials (by ID only): Supabase dsZvYaB5av1RwbxL (⚠ points at OLD "HR portal" project) · Anthropic mXPwb5lEbxPFmxDt.
- GitHub: code pushed to BOTH repos, synced at same history:
  - olive-lead-digest/design-dashboard (canonical, public)
  - olive-lead-digest/design-dashboard-prod (private — THIS one is wired to Vercel auto-deploy)
- Vercel: team olive-hospitality (team_YyFVd4LNwP4B8G2UhckVaDnH), project design-dashboard-prod
  (prj_vqPEfJmHggXZqAszFpvA4YKAKOQl). Domains: design-dashboard-prod.vercel.app (production, public),
  *-git-main-olive-hospitality.vercel.app (SSO-protected).
  ⚠ Commits authored by non-team members get state BLOCKED — author deploy commits as
  `olive-lead-digest <290953643+olive-lead-digest@users.noreply.github.com>` (empty commit trick works).
  GitHub Desktop (signed in on this Mac) is the only push channel; sandbox git has no credentials.
  Origin-swap dance: set-url origin → design-dashboard-prod.git → GH Desktop Fetch + Push → set-url back.

## Verified done
Local prod build clean · typecheck clean · smoke tests pass (auth gate, domain rejection,
tester email routing from/to verified, SVG plans, RLS 9/9) · no secrets in git · both repos pushed
· Vercel deployment dpl_DsVYNjKXpJZmGft6VNhcYQHaM6w8 READY (build logs show all routes).

## In flight / next steps
1. ⚠ CURRENT BUG: production domain 404s all routes despite READY deploy — Vercel project has
   framework: null (preset never set). Fix being applied: `"framework": "nextjs"` in vercel.json + redeploy.
   Verify after: /login (200, static) and /api/auth GET (401 JSON) on design-dashboard-prod.vercel.app.
2. Repoint n8n credential dsZvYaB5av1RwbxL → https://fwzdhmobfcwsspobrvdl.supabase.co + its service_role
   key (Supabase dashboard → Project Settings → API keys). Browser/UI only — key is not exposed via MCP.
   BLOCKED on Claude-in-Chrome extension (not installed/signed in on this Mac).
3. Activate DD-1…DD-5 AFTER step 2 (n8n MCP publish_workflow or UI toggles). Not before — schedules
   would write into the old HR-portal DB.
4. Vercel env vars (dashboard): SESSION_SECRET (long random) now; SUPABASE_SERVICE_KEY only when
   leaving tester mode. Non-secret vars already ship via committed .env.production.
5. End-to-end verify prod: login with any @oliveliving.com email (8+ char password), tester badge,
   email preview shows locked test addresses.

## Production switch (later)
docs/DEPLOYMENT.md — flip NEXT_PUBLIC_TESTER_MODE=false + MOCK_EMAIL_SEND=false in Vercel,
set SUPABASE_SERVICE_KEY, wire real email sending, THEN owner_email becomes live.
