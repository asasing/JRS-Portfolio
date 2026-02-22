# Architecture Reference

## Runtime
- Framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS v4 + token utilities in `src/app/globals.css`
- Data store: JSON files under `data/`

## Core Areas
- Public app routes: `src/app/page.tsx`, `src/components/portfolio/*`
- Admin UI: `src/app/admin/*`
- APIs: `src/app/api/*`
- Shared types: `src/lib/types.ts`
- Normalizers/helpers: `src/lib/*-normalizers.ts`

## Data Flow Pattern
1. Admin form edits local state.
2. Save calls API route.
3. API normalizes and writes `data/*.json`.
4. Public page loads JSON (or API-backed data) and renders normalized content.

## Media Flow
- Upload API: `/api/upload`
- Public path pattern: `/images/<category>/<file>`
- Keep render-time fallback guards for missing/blank image paths.

## Analytics Layer
- Provider: PostHog (`posthog-js`)
- Init: `src/components/analytics/PostHogProvider.tsx` — client component in root layout, excluded on `/admin/*`
- Capture helper: `src/lib/analytics.ts` → `capture(event, props?)` — server-safe, silent on failure
- Section tracking: `src/components/analytics/SectionTracker.tsx` — IntersectionObserver, renders null
- Custom events wired in: `Projects.tsx`, `ProjectDetail.tsx`, `Contact.tsx`
- Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`