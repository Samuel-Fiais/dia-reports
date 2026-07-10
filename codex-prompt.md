# Dia Reports — PostgreSQL + Vercel API

## Context

This is a Vite + React 18 SPA that renders report dashboards from JSON files. Currently it imports `.json` files from `src/reports/` at build time using `import.meta.glob`. You need to:

1. Add Vercel serverless functions (`api/` directory) that connect to a Neon PostgreSQL database
2. Replace the build-time JSON import with runtime API fetches
3. Add proper loading/error states to all pages
4. Add `vercel.json` for SPA + API routing

The database is already set up on Neon with a `reports` table. The 3 existing JSON reports have already been migrated.

## Database Schema (Neon PostgreSQL)

The `reports` table was created on the Neon database at:
`postgresql://neondb_owner:***@ep-lively-star-acsf0dsc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require`

Schema:
```sql
CREATE TABLE reports (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    content JSONB NOT NULL
);
```

Connection string (use environment variable `DATABASE_URL`):
```
postgresql://neondb_owner:***@ep-lively-star-acsf0dsc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

## What to do

### 1. Create `api/reports.js`

A Vercel serverless function (Node.js runtime) that handles two routes:

- **GET `/api/reports`** — Returns a list of all reports (for the dashboard). Return an array of objects with shape `{ id, slug, title, date, from, headline, intro[0], metrics_length }`. Only the lightweight list, NOT the full content JSONB.

- **GET `/api/reports/[slug]`** — Returns the full report object (the `content` JSONB column parsed, which has the same shape as the original JSON files).

Use `@neondatabase/serverless` package to connect to PostgreSQL. The `slug` comes from the URL path (the segment after `/api/reports/`).

IMPORTANT: The Vercel Edge runtime (edge-light) does NOT support `@neondatabase/serverless` WebSocket connections. Use the `nodejs` runtime instead:
```js
export const config = {
  runtime: 'nodejs'
};
```

Create the file at `api/reports/[[slug]].js` (catch-all route so a single function handles both `/api/reports` and `/api/reports/:slug`).

For the serverless function, use the `@neondatabase/serverless` package with a connection pooler URL. Use the `Pool` from `@neondatabase/serverless`.

The function should:
- Parse the URL to determine if it's a list request or a single report request
- For list: SELECT slug, title, date FROM reports ORDER BY date DESC
- For single: SELECT slug, title, date, content FROM reports WHERE slug = $1
- Return JSON responses with proper CORS headers (Access-Control-Allow-Origin: *)

### 2. Modify `src/lib/registry.js`

Replace the build-time `import.meta.glob` with async API calls:

```js
// Pasta comum de relatórios agora é via API
const API_BASE = '/api'

export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`)
  if (!res.ok) throw new Error('Failed to fetch reports')
  return res.json()
}

export async function getReport(slug) {
  const res = await fetch(`${API_BASE}/reports/${slug}`)
  if (!res.ok) return null
  const data = await res.json()
  // The content is the full JSON from the `content` column
  // Merge the lightweight fields with the content
  return data.content ? { ...data.content, id: data.slug } : null
}
```

### 3. Modify `src/pages/Home.jsx`

Change from synchronous import to async fetch with loading/error states:
- Add `useEffect` that calls `fetchReports()` on mount
- Show a loading skeleton while fetching
- Handle errors gracefully
- Keep the same render structure for the report cards
- Keep `applyTheme` and `useAppTheme` behavior unchanged

### 4. Modify `src/pages/ReportPage.jsx`

Change from synchronous `getReport(id)` to async fetch:
- Add `useEffect` that calls `getReport(slug)` on mount (the slug is the `id` param)
- Show a loading skeleton while fetching
- Handle 404 (report not found) — keep the existing 404 UI
- Keep `settings`, `theme`, `ShareButton`, `SettingsPanel`, `ReportView` behavior unchanged

### 5. Create `vercel.json` at project root

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

This ensures the SPA handles routing on the client side, while API requests go to serverless functions.

### 6. Create `api/package.json`

The API directory needs its own package.json for Vercel to detect dependencies:

```json
{
  "name": "dia-reports-api",
  "private": true,
  "type": "module",
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0"
  }
}
```

Actually, for Vercel, if the function is in `api/` and the root package.json doesn't have `@neondatabase/serverless`, then you need a separate `api/package.json`. To keep it simpler, just add `@neondatabase/serverless` to the root `package.json` and Vercel will install it there.

### 7. Update `.gitignore`

Add `.vercel` to `.gitignore`.

## Critical constraints

- **DO NOT delete the `src/reports/*.json` files** — keep them as seed data / reference
- **DO NOT change `src/styles/dia.css`** — the CSS must stay exactly as is
- **DO NOT change any React component internals** (ReportView, SettingsPanel, ShareButton, blocks, ThemeContext, etc.) — only Home.jsx, ReportPage.jsx, and registry.js need modification
- **DO NOT change the routing structure** — keep `/report/:id` as the URL pattern
- **The `content` column in the DB stores the exact JSON shape as the original files** — the frontend receives the same data shape, just via HTTP instead of import
- **Run `npm run build` after making changes** and fix any errors
- **Keep all existing dependencies** — only add `@neondatabase/serverless`
- **DO NOT convert to TypeScript** — keep .jsx and .js files

## Verification

After making all changes:
1. Run `npm run build` — must pass with no errors
2. The built `dist/index.html` should load and the React app should render
3. The API endpoints should work when deployed on Vercel (tested separately)