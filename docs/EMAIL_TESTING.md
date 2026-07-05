# Email Testing Contract (Tester Mode)

This is the single most important safety rule in the app. Read it before touching any send flow.

## The contract

While `NEXT_PUBLIC_TESTER_MODE=true` **or** `NEXT_PUBLIC_MOCK_EMAIL_SEND=true`:

| | Address | Role |
| --- | --- | --- |
| **From** | `theopenhotels@gmail.com` | The only sender, ever |
| **To** | `akashsakhrani05@gmail.com` | The only recipient, ever |

- **No other email address is ever used.** Not `projects.owner_email`, not the logged-in user, not anything typed into a form. Production recipients are accepted by the API for the audit trail only.
- **Nothing is actually dispatched.** All sends are preview-only. There is no SMTP anywhere in the app, and the n8n workflows contain zero email nodes.

## Where it is enforced

Defense in depth — four independent layers:

1. **`src/lib/email.ts` — `resolveEmailRouting()`** — the single source of truth. If either tester flag is on, it returns `{ from: TESTER_SENDER, to: TESTER_RECEIVER }` unconditionally; the `productionRecipient` argument is ignored for routing. The hardcoded addresses live in `src/lib/constants.ts` (`TESTER_SENDER`, `TESTER_RECEIVER`).
2. **`EmailPreviewModal`** (`src/components/modals/EmailPreviewModal.tsx`) — the From/To fields are locked (read-only) and display the tester routing; the modal carries the tester banner. The rendered email HTML also appends a footer: "TESTER MODE — routed theopenhotels@gmail.com → akashsakhrani05@gmail.com. No production email was sent."
3. **Every send endpoint** — all ✉ routes (`.../feasibility/send-to-owner`, `.../floor-plans/[planId]/send-to-owner`, `.../communications/send-to-owner`, `/api/projections/[projectionId]/send`) build their preview through `buildEmailPreview()` → `resolveEmailRouting()`. None constructs addresses independently.
4. **n8n (DD-1 … DD-5)** — zero email nodes in all five workflows, and they are inactive besides. Even a misconfigured workflow cannot email anyone.

The UI shows a persistent badge while tester mode is on: `🧪 TESTER MODE - Emails: theopenhotels@gmail.com → akashsakhrani05@gmail.com`.

## What "Send" actually does in tester mode

Clicking Send to Owner (or Send on a projection):

1. Resolves routing → always `theopenhotels@gmail.com → akashsakhrani05@gmail.com`.
2. Builds the branded Olive Living HTML email (preview only).
3. Writes a `communications` record (subject, message, `sent_to_owner`, timestamps).
4. Writes an `audit_logs` entry recording the action and the tester routing.
5. Updates the source record's status (e.g. feasibility → `Sent to Owner`, floor plan → `sent_to_owner_at`).
6. Returns `{ status, email_preview }` — the modal shows exactly what production *would* send.

No network call to any mail service happens at any point.

## Verification checklist

Run this whenever email code or env vars change:

- [ ] `.env.local` (or Vercel env) has `NEXT_PUBLIC_TESTER_MODE=true` and `NEXT_PUBLIC_MOCK_EMAIL_SEND=true`.
- [ ] The tester badge is visible in the app header.
- [ ] Feasibility → Send to Owner: preview shows From `theopenhotels@gmail.com`, To `akashsakhrani05@gmail.com`, fields locked.
- [ ] Floor plan → Send to Owner: same routing.
- [ ] Communications → Send to Owner: same routing.
- [ ] Projections → Send: same routing (recipients overridden).
- [ ] API check: each send response has `email_preview.testerMode: true` and the two tester addresses.
- [ ] The communication log and audit log gained entries; no email arrived anywhere except (in production-mode-with-SMTP later phases) the test inbox.
- [ ] n8n: all five DD workflows contain no Send Email / Gmail / SMTP nodes.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Preview shows an unexpected address | `NEXT_PUBLIC_TESTER_MODE` and `NEXT_PUBLIC_MOCK_EMAIL_SEND` — both must be the string `true`. Restart `npm run dev` after editing `.env.local`; redeploy after editing Vercel env. |
| Tester badge missing | Same two env vars; the badge derives from `IS_TESTER_MODE` in `src/lib/constants.ts`. |
| `testerMode: false` in a send response | Env vars not loaded in the server runtime — check the deployment's environment variable scope (Production vs Preview). |
| Send appears to do nothing | It logged a communication + audit entry and returned a preview — that is the designed tester behavior. Check the Communications tab. |

## Incident response

**If any real address (an owner's, a colleague's, anything other than the two tester addresses) ever appears in an email preview: STOP.**

1. Do not click Send again.
2. Check `NEXT_PUBLIC_TESTER_MODE` and `NEXT_PUBLIC_MOCK_EMAIL_SEND` in the running environment (`.env.local` locally, Vercel dashboard for deploys). One of them is not `true`.
3. Restore both to `true`, restart/redeploy, and re-run the verification checklist above before resuming.
4. Since tester mode has no SMTP path, no email was dispatched — but treat the misconfiguration as a release blocker until explained.
