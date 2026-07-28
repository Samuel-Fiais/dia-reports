# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install deps
npm run dev       # vite dev server
npm run build     # production build (dist/)
npm run preview   # preview the production build
npm test          # node:test suite for API helpers
```

No linter is configured in this project.

The API route (`api/reports.js`) is a Vercel serverless function and needs `DATABASE_URL`
(Neon Postgres connection string, see `.env.local`) to respond — `npm run dev` alone (plain
Vite) won't serve `/api/*`. Use `vercel dev` if you need to exercise the API locally.

## Architecture

**Data flow: DB-backed.** `src/lib/registry.js` fetches publication data over HTTP from `/api/reports` (list)
and `/api/reports/:slug` (single), and `api/reports.js` queries a Postgres `reports` table
(via `@neondatabase/serverless`) with columns `slug`, `title`, `date`, `content` (jsonb).
This repository is only the renderer/admin shell; report content is published by an external
authorized process writing to Postgres. Routing to the API is done via `vercel.json` rewrites
(`/api/reports/:path*` → `/api/reports`, catch-all `[[...slug]].js`-style single function).

**Publication rendering pipeline**: `pages/ReportPage.jsx` fetches one publication by `:id`,
normalizes it through `lib/publication.js`, and sends it to
`components/PublicationRenderer.jsx`. Layout selection is driven by `renderMode`. Each body
block is dispatched by `components/blocks/index.jsx` to generic implementations grouped by
concern. `src/lib/blockContract.js` is the canonical vocabulary and
`src/lib/blockRegistry.js` is the editor metadata for that vocabulary. Unknown block types
are rejected; there are no compatibility aliases.

The full block-type vocabulary and JSON publication schema are documented in
`REPORT-SCHEMA.md`. `AGENTS.md` has authoring guidance (tone, block selection, checklist) for
anyone/anything generating report JSON content — read it before writing report content.

**Appearance/theming**: `src/lib/theme.js` defines the color palette (light + dark variants),
font stacks, and chart-fill styles, applied at runtime via CSS custom properties
(`applyTheme`). Per-report appearance choices (`colorIndex`, `fontIndex`, `chartStyleIndex`)
are set as JSON `settings` (initial state only) but overridable per-report by the reader via
the "Customize Report" (⚙) panel (`components/SettingsPanel.jsx`), persisted to
`localStorage` keyed by report id. Dark/light app theme is separate, global, and lives in
`context/ThemeContext.jsx`.

**Auth and sharing**: report reads are filtered by visibility and report groups in
`api/_lib/auth.js`. The "Share" button (`components/ShareButton.jsx`) asks the API to create a
share token and copies `/shared/<token>`; do not model report visibility as a JSON field in
`content`.

## Language

Report content (headline, intro, body text) is authored in Brazilian Portuguese with an
editorial tone, per `AGENTS.md`. UI copy in `src/components/`/`src/pages/` follows the same
convention where present.
