# Architecture Reference

## Runtime
- Framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS v4 + token utilities in `src/app/globals.css`
- Data store: Supabase (Postgres for data, Storage for images)
- Supabase client: `src/lib/supabase.ts` (public anon + admin service_role)
- Data layer: `src/lib/data.ts` (entity-specific CRUD with internal snake_case ↔ camelCase mappers)

## Database Tables
- `profile` — singleton row (id = 'default')
- `projects` — with `sort_order` column for ordering
- `project_categories` — with `sort_order` column
- `services` — with `sort_order` column
- `certifications` — with `sort_order` column
- `contact_submissions` — stores all contact form entries

## RLS Policy
- All data tables: public SELECT for `anon` role
- `contact_submissions`: public INSERT for `anon` role
- `service_role` bypasses RLS entirely (used by admin API routes)

## Authentication
- Provider: Supabase Auth (email + password)
- Login: `src/app/api/auth/login/route.ts` → `supabase.auth.signInWithPassword()`
- Logout: `src/app/api/auth/logout/route.ts` → `supabase.auth.signOut()`
- Middleware: `src/middleware.ts` — verifies Supabase session, redirects unauthenticated to `/admin/login`
- API auth: `src/lib/api-auth.ts` → `authenticateRequest()` verifies session via `supabase.auth.getUser()`
- Browser client: `src/lib/supabase-browser.ts` — used by client components
- Server client: `createSupabaseServerClient()` in `src/lib/supabase.ts` — cookie-based via `@supabase/ssr`

## Core Areas
- Public app routes: `src/app/page.tsx`, `src/components/portfolio/*`
- Admin UI: `src/app/admin/*`
- APIs: `src/app/api/*`
- Shared types: `src/lib/types.ts`
- Normalizers/helpers: `src/lib/*-normalizers.ts`

## Data Flow Pattern
1. Admin form edits local state.
2. Save calls API route.
3. API normalizes and writes to Supabase via `src/lib/data.ts` functions.
4. Public page loads data from Supabase and renders normalized content.

## Media Flow
- Upload API: `/api/upload` → Supabase Storage bucket `images`
- Stored URL pattern: `https://<ref>.supabase.co/storage/v1/object/public/images/<category>/<file>`
- `next.config.ts` has `remotePatterns` configured for the Supabase hostname
- Keep render-time fallback guards for missing/blank image paths.

## Favicon
- Dynamic route handler: `src/app/icon/route.ts` serves at `/icon`
- Reads `profile.favicon` from Supabase; proxies image if set, otherwise returns `public/default-favicon.png`
- Layout metadata: `icons: { icon: '/icon' }` (static reference, no `generateMetadata()`)
- Admin profile uploader stores favicon URL in `profile.favicon` column; media cleanup handles old images

## Analytics Layer
- Provider: PostHog (`posthog-js`)
- Init: `src/components/analytics/PostHogProvider.tsx` — client component in root layout, excluded on `/admin/*`
- Capture helper: `src/lib/analytics.ts` → `capture(event, props?)` — server-safe, silent on failure
- Section tracking: `src/components/analytics/SectionTracker.tsx` — IntersectionObserver, renders null
- Custom events wired in: `Projects.tsx`, `ProjectDetail.tsx`, `Contact.tsx`
- Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
