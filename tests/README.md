# Manual QA Checklist

Run top-to-bottom against `npm run dev` (or a preview deploy) in tester mode. Every email assertion below must show **From `theopenhotels@gmail.com` → To `akashsakhrani05@gmail.com`** — any other address is an instant FAIL (see [docs/EMAIL_TESTING.md](../docs/EMAIL_TESTING.md)).

## 1. Login & session

- [ ] Wrong domain rejected: `someone@gmail.com` + valid password → validation error, no session.
- [ ] Short password rejected: `harshit.s@oliveliving.com` + `1234567` (7 chars) → validation error.
- [ ] Valid login works: any `@oliveliving.com` email + 8+ char password → lands on dashboard.
- [ ] Tester badge visible: `🧪 TESTER MODE - Emails: theopenhotels@gmail.com → akashsakhrani05@gmail.com`.
- [ ] Direct URL access while logged out redirects to `/login`.
- [ ] Logout clears the session (back button does not restore access).

## 2. Dashboard & all 8 tabs

- [ ] Dashboard shows 5 seeded projects with correct statuses (Active / Feasibility / Design / Execution / Complete) and stats.
- [ ] Open "Olive Koramangala Residences" and click through all 8 tabs — each renders without errors or empty crashes:
  - [ ] Overview
  - [ ] Documents
  - [ ] Feasibility
  - [ ] Floor Plans
  - [ ] Investment
  - [ ] Communications
  - [ ] Tasks
  - [ ] Projections

## 3. Documents → feasibility auto-generation

- [ ] Drag-and-drop a file onto the Documents tab → upload succeeds, appears in the list with category + client/internal tag.
- [ ] After upload, a feasibility study is auto-generated (or refreshed) for the project — check the Feasibility tab shows a generated study with summary, timeline, risks, cost breakdown, recommendations.
- [ ] Delete a document → it disappears from the list.

## 4. Kanban (Tasks)

- [ ] Drag a task card from "Not Started" to "In Progress" → it stays after refresh (status persisted via PUT).
- [ ] Drag to "Done" → `completed_at` set (card shows completion), accountability metrics update.
- [ ] Create a new task (owner, type, due date, priority) → appears in the right column.
- [ ] Overdue tasks are visually flagged.

## 5. All 4 send flows (the critical check)

For each, the Email Preview modal must show locked fields **From `theopenhotels@gmail.com` → To `akashsakhrani05@gmail.com`**, a tester-mode banner, and the branded Olive Living template:

- [ ] Feasibility → **Send to Owner** (status flips to "Sent to Owner", communication + audit logged).
- [ ] Floor Plan → **Send to Owner**.
- [ ] Communications → **Send to Owner**.
- [ ] Projections → **Send**.
- [ ] After each send: a new entry appears in the Communications log; nothing arrives at any real owner address.

## 6. Floor plans & projections

- [ ] 2D SVG plan renders with room labels/dimensions; version switcher works (Koramangala has v1 and v2).
- [ ] 3D view renders (three.js) and supports orbit/zoom.
- [ ] Projections tab: generate a new projection (Timeline / Budget / ROI / Risk) → chart renders with insights + confidence level.

## 7. Print-to-PDF

- [ ] Floor plan → Export PDF → browser print dialog produces a clean, legible PDF (no clipped nav/chrome).
- [ ] Feasibility report prints cleanly via browser print-to-PDF.

## 8. Responsive & accessibility

- [ ] At 375px width (DevTools iPhone view): navigation collapses appropriately, tables/kanban scroll instead of overflowing, modals fit the viewport.
- [ ] At 768px and 1440px: layout uses space sensibly, no overlap.
- [ ] Keyboard nav: Tab reaches all interactive controls in a logical order with a visible focus ring; Enter/Space activates buttons; Escape closes modals; the Email Preview modal traps focus.
- [ ] No console errors during the whole pass.

## Sign-off

| Check | Result | Tester | Date |
| --- | --- | --- | --- |
| Sections 1–8 all pass | ☐ PASS / ☐ FAIL | | |
| Email routing correct in all 4 send flows | ☐ PASS / ☐ FAIL | | |
