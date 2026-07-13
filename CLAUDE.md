# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install deps
npm run dev       # vite dev server
npm run build     # production build (dist/)
npm run preview   # preview the production build
```

No test runner or linter is configured in this project.

The API route (`api/reports.js`) is a Vercel serverless function and needs `DATABASE_URL`
(Neon Postgres connection string, see `.env.local`) to respond — `npm run dev` alone (plain
Vite) won't serve `/api/*`. Use `vercel dev` if you need to exercise the API locally.

## Architecture

**Data flow: DB-backed, not the JSON files you'd expect.** `src/reports/*.json` (e.g.
`exemplo-completo.json`) are schema references/examples only — the running app does **not**
import them. `src/lib/registry.js` fetches report data over HTTP from `/api/reports` (list)
and `/api/reports/:slug` (single), and `api/reports.js` queries a Postgres `reports` table
(via `@neondatabase/serverless`) with columns `slug`, `title`, `date`, `content` (jsonb). If
you're asked to add/edit a report, the content needs to end up as a row in that table — editing
or adding a file under `src/reports/` alone has no effect on the deployed/dev app. Routing to
the API is done via `vercel.json` rewrites (`/api/reports/:path*` → `/api/reports`, catch-all
`[[...slug]].js`-style single function).

**Report rendering pipeline**: `pages/ReportPage.jsx` fetches one report by `:id` and renders
it through `components/ReportView.jsx`. Each `body` block's `type` is dispatched by the giant
switch in `components/blocks/index.jsx` (`ItemBlock`) to one of the block implementations
grouped by concern in `components/blocks/{content,structure,compare,plan,analytics,advanced}.jsx`
plus a handful of standalone top-level components (`ChartBlock`, `TodoBlock`, `Kanban`,
`TabsBlock`, `Agenda`, `Calendar{Month,Week,Year}`, `Badges`). Unknown block `type`s are
silently ignored (return `null`) — this is intentional, not a bug, per `AGENTS.md`.

The full block-type vocabulary and JSON report schema are documented in `REPORT-SCHEMA.md`;
`src/reports/exemplo-completo.json` is a living reference containing at least one example of
every block type. `AGENTS.md` has authoring guidance (tone, block selection, checklist) for
anyone/anything generating report JSON content — read it before writing report content.

**Appearance/theming**: `src/lib/theme.js` defines the color palette (light + dark variants),
font stacks, and chart-fill styles, applied at runtime via CSS custom properties
(`applyTheme`). Per-report appearance choices (`colorIndex`, `fontIndex`, `chartStyleIndex`)
are set as JSON `settings` (initial state only) but overridable per-report by the reader via
the "Customize Report" (⚙) panel (`components/SettingsPanel.jsx`), persisted to
`localStorage` keyed by report id. Dark/light app theme is separate, global, and lives in
`context/ThemeContext.jsx`.

**No auth**: the "Share" button (`components/ShareButton.jsx`) just copies a
`/report/<id>?shared=1` link for UI convenience (hides the back-to-dashboard chrome) — it is
not access control. Don't imply otherwise when discussing "sharing" a report with sensitive
data.

## Language

Report content (headline, intro, body text) is authored in Brazilian Portuguese with an
editorial tone, per `AGENTS.md`. UI copy in `src/components/`/`src/pages/` follows the same
convention where present.
