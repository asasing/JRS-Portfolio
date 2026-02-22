# JRS Portfolio

A personal portfolio + admin CMS built with Next.js App Router, TypeScript, and Tailwind CSS.

## Overview
- Public site sections: Hero/About, Services, Recent Works, Certifications, Contact
- Admin dashboard for content management: profile, services, projects, certifications, categories
- Data persistence via Supabase (Postgres tables + Storage bucket for images)
- Contact form submissions stored in Supabase `contact_submissions` table + SMTP email

## Runbook
```bash
npm install
npm run dev
npm run build
npm run lint
```

## Environment Variables
Set these in `.env`:

- `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anon/public key)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase service role key)
- `CONTACT_TO_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_DRY_RUN` (optional)
- `NEXT_PUBLIC_POSTHOG_KEY` (PostHog project API key)
- `NEXT_PUBLIC_POSTHOG_HOST` (PostHog ingestion host, default `https://us.i.posthog.com`)

Contact semantics:
- Real SMTP send is the default expectation.
- `CONTACT_DRY_RUN=true` is explicit opt-in for local testing only.
- If SMTP config is missing, contact API returns service-unavailable error.

## Data Layer (Supabase)
- `profile` table (singleton row) -> profile/about/hero data
- `services` table -> services list
- `projects` table -> projects content, media, categories
- `project_categories` table -> ordered category chips source
- `certifications` table -> certifications, provider palette, metadata
- `contact_submissions` table -> contact form submission log
- `images` Storage bucket -> all uploaded images (profile, projects, services, certifications)

### Supabase Setup (for new environments)
1. Run `scripts/supabase-migration.sql` in the Supabase Dashboard SQL Editor
2. Run `npx tsx scripts/setup-supabase.ts` to create the storage bucket and verify tables
3. Run `npx tsx scripts/migrate-to-supabase.ts` to seed data from legacy `data/*.json` files
4. Create admin user: `npx tsx scripts/create-admin-user.ts <email> <password>`

## Feature Map
Admin pages and related APIs:
- `/admin/profile` <-> `/api/profile`
- `/admin/services` <-> `/api/services`
- `/admin/projects` <-> `/api/projects`, `/api/project-categories`
- `/admin/certifications` <-> `/api/certifications`
- Reorder APIs: `/api/projects/reorder`, `/api/certifications/reorder`
- Uploads via `/api/upload`
- Contact form via `/api/contact`
- Analytics: PostHog via `src/components/analytics/PostHogProvider.tsx`; excluded from `/admin/*`

## Where To Update What
- Visual rules and spacing/tokens: `DESIGN_SYSTEM.md`
- Architecture notes + change history: `CLAUDE.md`
- Shared contracts: `src/lib/types.ts`
- Normalization logic: `src/lib/*-normalizers.ts`
- Reusable codex workflow: `.codex/skills/portfolio-maintainer/`

## Notes
- Tailwind-only styling (no Bootstrap).
- Keep admin edit flow, API normalization, and public rendering aligned when adding fields.
- Removed/replaced images are cleaned automatically from Supabase Storage when they are no longer referenced by database records.
- Browser tab icon: replace `src/app/icon.png` (Next.js file-based metadata). Do not add a `favicon.ico` alongside it — browsers prioritize `.ico` over `.png`.
