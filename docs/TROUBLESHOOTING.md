# Troubleshooting

Common issues, in the order you're likely to hit them.

## Port 3000 already in use

`npm run dev` fails with `EADDRINUSE`.

```bash
lsof -ti:3000 | xargs kill -9   # free the port
# or run on another port:
npm run dev -- -p 3001
```

## Env vars not loading / changes ignored

Next.js reads `.env.local` **at startup** and inlines `NEXT_PUBLIC_*` values at build time. After any edit:

- Local: stop and restart `npm run dev`.
- Vercel: env var changes apply only to **new** deployments — trigger a redeploy.
- Confirm the file is named exactly `.env.local` (not `.env.local.txt`) and sits in the project root.

## 401 loops (login → immediately bounced back to login)

The session cookie fails verification on every request. Causes:

- **`SESSION_SECRET` mismatch** — the cookie was signed with a different secret than the one now verifying it (e.g. secret changed, or local vs deployed values differ). Fix: clear the `dd_session` cookie in DevTools → Application → Cookies, and make sure the running process has one consistent `SESSION_SECRET`.
- **Expired session** — 30 minutes of inactivity logs you out by design; log in again.
- **Non-@oliveliving.com email** — the middleware rejects any session whose email doesn't end in `@oliveliving.com`.

## 429 "Rate limit exceeded"

You crossed 50 API requests/min per user+IP (enforced in `src/middleware.ts`). Wait up to 60 seconds — the bucket resets every minute. If it happens during normal use, look for a component fetching in a loop (e.g. a `useEffect` missing its dependency array or an over-eager TanStack Query `refetchInterval`).

## Supabase returns no rows (but the data exists)

Almost always RLS. The `org_isolation` policy on all 9 tables only passes when the request's JWT contains an `@oliveliving.com` email.

- **Anon key + no Supabase Auth session** (the tester-mode situation): client-side reads through the anon key are blocked by RLS — expected. Tester mode uses the in-memory mock store instead, so if you see this, check `NEXT_PUBLIC_TESTER_MODE=true`.
- **Server code**: must use `SUPABASE_SERVICE_KEY` (service_role bypasses RLS by design). If a server route uses the anon key by mistake, it gets zero rows.
- Verify in Supabase SQL Editor (which runs privileged): `select count(*) from projects;` — 5 rows should exist from the seed.

## n8n workflows failing

- **Most likely:** the Supabase credential `dsZvYaB5av1RwbxL` still points at an old project. Repoint it to `https://fwzdhmobfcwsspobrvdl.supabase.co` with this project's `service_role` key (see [SETUP.md](SETUP.md) §4).
- Workflows DD-1 … DD-5 are **inactive by design** during tester mode — "failing to trigger" usually means "not activated yet".
- For webhook workflows, confirm the app's `N8N_API_KEY` matches the instance and the webhook paths (`feasibility-generator`, `floor-plan-generator`, `communication-logger`) are unchanged.
- Check each workflow's Executions tab in n8n for the failing node's error.

## three.js floor plan shows a blank canvas

The 3D viewer needs WebGL:

- Test at `https://get.webgl.org` — if it fails, enable hardware acceleration (Chrome: Settings → System → "Use graphics acceleration") or update GPU drivers.
- Headless/remote/VM environments often lack WebGL — expected there.
- If WebGL works but the canvas is still blank, check the browser console for context-lost or texture errors, and make sure the tab isn't backgrounded during first render.

## Build errors (`npm run build`)

- **Node version** — Node.js **18+** is required (Next.js 14). Check `node -v`; upgrade via nvm: `nvm install 20 && nvm use 20`.
- Clean rebuild after dependency or config weirdness:
  ```bash
  rm -rf node_modules .next
  npm install
  npm run build
  ```
- Type errors referencing domain models: `src/types/index.ts` mirrors `database/schema.sql` — if you changed one, change the other.

## Still stuck

Check the email-specific guide ([EMAIL_TESTING.md](EMAIL_TESTING.md)) for anything send-related, and the audit log (`audit_logs` table / mock store) to reconstruct what the app actually did.
