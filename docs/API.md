# API Reference

All routes live under `/api` (Next.js App Router route handlers). Response entity shapes are the domain types in `src/types/index.ts`, which mirror `database/schema.sql` exactly.

## Conventions

- **Auth** — every route except `/api/auth` requires a valid `dd_session` cookie (HMAC-signed, @oliveliving.com only). Middleware verifies it on every request, and each route revalidates via `requireSession()`. Missing/invalid session → `401 { "error": "Unauthorized — @oliveliving.com session required" }`.
- **Rate limiting** — 50 requests/min per user+IP across all `/api/*` routes. Exceeding it → `429 { "error": "Rate limit exceeded. Try again in a minute." }`.
- **Errors** — always `{ "error": string }` with an appropriate status (`400` validation, `401` auth, `404` not found, `429` rate limit, `500` server).
- **Send endpoints** (marked ✉ below) return `{ status, email_preview }`. In tester mode `email_preview.from` is **always** `theopenhotels@gmail.com` and `email_preview.to` is **always** `akashsakhrani05@gmail.com`, `testerMode: true`, and **nothing is dispatched** — the send is recorded as a communication + audit log only. See [EMAIL_TESTING.md](EMAIL_TESTING.md).

`EmailPreview` shape:

```json
{ "from": "theopenhotels@gmail.com", "to": "akashsakhrani05@gmail.com", "subject": "...", "html": "<!DOCTYPE html>...", "testerMode": true }
```

## Auth — `/api/auth`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/auth` | — | Current session user `{ email }`; `401` if none |
| POST | `/api/auth` | `{ email, password }` | Sets the `dd_session` cookie and returns the session user. Tester mode: any `@oliveliving.com` email + password ≥ 8 chars |
| DELETE | `/api/auth` | — | Clears the session cookie (logout) |

## Stats — `/api/stats`

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/stats` | Dashboard aggregates: project counts by status, task/overdue counts, pending approvals, recent activity |

## Projects — `/api/projects`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects` | — | `Project[]` |
| POST | `/api/projects` | `{ name, owner_email, property_location, property_type, description?, status? }` | Created `Project` |
| GET | `/api/projects/[id]` | — | `Project` (404 if unknown id) |
| PUT | `/api/projects/[id]` | Partial `Project` fields (e.g. `{ status }`) | Updated `Project` |

`owner_email` is a production-only field for the audit trail — it is **never** emailed in tester mode.

## Documents — `/api/projects/[id]/documents`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/documents` | — | `ProjectDocument[]` |
| POST | `/api/projects/[id]/documents` | `{ file_name, document_type: "client"\|"internal", file_category, uploaded_by? }` | Created `ProjectDocument`. Uploading also triggers feasibility auto-generation (mocked in tester mode; n8n DD-1 in production) |
| DELETE | `/api/projects/[id]/documents/[docId]` | — | Deletion confirmation |

`file_category` ∈ `Agreement | Permit | Survey | Specification | Reference`.

## Feasibility — `/api/projects/[id]/feasibility`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/feasibility` | — | Latest `FeasibilityStudy` for the project (executive summary, timeline, risks, cost breakdown, recommendations, detailed report) |
| POST ✉ | `/api/projects/[id]/feasibility/send-to-owner` | — | `{ status, email_preview }`; marks the study `Sent to Owner`, logs a communication + audit entry |
| POST | `/api/projects/[id]/feasibility/regenerate` | — | Freshly generated `FeasibilityStudy` |

## Floor plans — `/api/projects/[id]/floor-plans`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/floor-plans` | — | `FloorPlan[]` (all versions) |
| POST | `/api/projects/[id]/floor-plans` | Generation options (design notes etc.) | New `FloorPlan` version |
| GET | `/api/projects/[id]/floor-plans/[planId]` | — | Single `FloorPlan` with `dimensions_json` (rooms) and `materials_json` |
| GET | `/api/projects/[id]/floor-plans/[planId]/svg` | — | The 2D plan as SVG markup |
| POST ✉ | `/api/projects/[id]/floor-plans/[planId]/send-to-owner` | — | `{ status, email_preview }`; stamps `sent_to_owner_at`, logs communication + audit |
| GET | `/api/projects/[id]/floor-plans/[planId]/export-pdf` | — | Print-ready plan document (use the browser's print-to-PDF) |

## Communications — `/api/projects/[id]/communications`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/communications` | — | `Communication[]` |
| POST | `/api/projects/[id]/communications` | `{ communication_type, subject?, message }` | Created `Communication` |
| POST ✉ | `/api/projects/[id]/communications/send-to-owner` | `{ subject, message }` (or a communication reference) | `{ status, email_preview }`; sets `sent_to_owner` + timestamps, logs audit |

`communication_type` ∈ `email | dashboard_notification | feasibility_sent | floor_plan_sent | status_update`.

## Tasks — project-scoped and global

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/tasks` | — | `TeamTask[]` for the project |
| POST | `/api/projects/[id]/tasks` | `{ task_owner_email, task_title, task_type, description?, due_date, priority? }` | Created `TeamTask` |
| PUT | `/api/projects/[id]/tasks/[taskId]` | Partial task fields — `{ status }` (kanban drag), `{ priority }`, `{ completion_notes }` … | Updated `TeamTask` (`completed_at` stamped when status becomes `Done`) |
| GET | `/api/projects/[id]/tasks/accountability` | — | `AccountabilityMetric[]` for the project's BD members |
| GET | `/api/tasks` | — | `TeamTask[]` across all projects |
| POST | `/api/tasks` | Task fields incl. `project_id` | Created `TeamTask` |
| GET | `/api/tasks/accountability` | — | Org-wide `AccountabilityMetric[]` (per BD member: total, completed, completion rate, overdue, avg completion days) |

`status` ∈ `Not Started | In Progress | Done | Overdue`; `priority` ∈ `Low | Medium | High`.

## Investment — `/api/projects/[id]/investment`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/investment` | — | `InvestmentRequirement` (total, currency, breakdown, ROI %, payment schedule, approval flag) |
| PUT | `/api/projects/[id]/investment` | Partial fields (`total_investment`, `breakdown`, `estimated_roi_percent`, `payment_schedule` …) | Updated `InvestmentRequirement` |
| POST | `/api/projects/[id]/investment/owner-approval` | — | `InvestmentRequirement` with `approved_by_owner: true` + audit entry |

## Projections — `/api/projections`

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projections` | — | `Projection[]` (portfolio-wide: Timeline, Budget, ROI, Risk) |
| POST | `/api/projections` | `{ projection_type: "Timeline"\|"Budget"\|"ROI"\|"Risk", project_id? }` | Newly generated `Projection` (weekly auto-generation runs via n8n DD-5 in production) |
| POST ✉ | `/api/projections/[projectionId]/send` | Optional recipients (ignored in tester mode) | `{ status, email_preview }` — tester mode always overrides recipients to `akashsakhrani05@gmail.com` |
| GET | `/api/projects/[id]/projections` | — | `Projection[]` scoped to one project |
