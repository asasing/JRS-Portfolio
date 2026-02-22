# JRS Portfolio

A personal portfolio + admin CMS built with Next.js App Router, TypeScript, and Tailwind CSS.

## Overview
- Public site sections: Hero/About, Services, Recent Works, Certifications, Contact
- Admin dashboard for content management: profile, services, projects, certifications, categories
- Data persistence via local JSON files in `data/`
- Upload pipeline for images under `public/images/<category>/`

## Runbook
```bash
npm install
npm run dev
npm run build
npm run lint
```

## Environment Variables
Set these in `.env`:

- `JWT_SECRET`
- `ADMIN_PASSWORD_HASH` (preferred) or `ADMIN_PASSWORD`
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

## Data Files and Contracts
- `data/profile.json` -> profile/about/hero data
- `data/services.json` -> services list
- `data/projects.json` -> projects content, media, categories
- `data/project-categories.json` -> ordered category chips source
- `data/certifications.json` -> certifications, provider palette, metadata

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
- Removed/replaced images are cleaned automatically when they are no longer referenced by data (protected placeholders are retained).
- Browser tab icon: replace `src/app/icon.png` (Next.js file-based metadata). Do not add a `favicon.ico` alongside it — browsers prioritize `.ico` over `.png`.
