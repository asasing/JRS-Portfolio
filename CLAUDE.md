# CLAUDE.md

## Purpose
This file is a persistent project context and handoff note for future sessions.
It documents architecture, data flow, key decisions, and recent changes implemented.

## Project Overview
- Project: `JRS-Portfolio`
- Stack: Next.js App Router, React, TypeScript, Tailwind CSS v4, Framer Motion
- Data source: Supabase (Postgres for data, Storage for images)
- Admin panel: `/admin/*` for managing profile, projects, services, certifications
- Legacy: local JSON files in `data/` are retained as reference but no longer used at runtime

## Run and Verify
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`

## Core Structure
- App routes: `src/app/*`
- Admin pages: `src/app/admin/*`
- API routes: `src/app/api/*`
- UI components: `src/components/*`
- Shared types: `src/lib/types.ts`
- Supabase client: `src/lib/supabase.ts` (public anon client + admin service_role client)
- Data layer: `src/lib/data.ts` (entity-specific CRUD functions backed by Supabase)
- Database tables: `profile`, `projects`, `project_categories`, `services`, `certifications`, `contact_submissions`
- Image storage: Supabase Storage bucket `images` with folders `profile/`, `projects/`, `services/`, `certifications/`
- Legacy JSON content (reference only): `data/profile.json`, `data/projects.json`, `data/services.json`, `data/certifications.json`, `data/project-categories.json`

## Auth and Admin Access
- Authentication: Supabase Auth (email + password)
- Login API: `src/app/api/auth/login/route.ts` — calls `supabase.auth.signInWithPassword()`
- Logout API: `src/app/api/auth/logout/route.ts` — calls `supabase.auth.signOut()`
- Middleware protection: `src/proxy.ts` — verifies Supabase session via `supabase.auth.getUser()`
- API auth: `src/lib/api-auth.ts` — `authenticateRequest()` verifies Supabase session (no args needed)
- Browser client: `src/lib/supabase-browser.ts` — used by client components
- Server auth client: `createSupabaseServerClient()` in `src/lib/supabase.ts` — cookie-based server client
- Session management: handled automatically by Supabase via `@supabase/ssr` cookies
- Admin user setup: `npx tsx scripts/create-admin-user.ts <email> <password>`

## Upload System
- Upload endpoint: `POST /api/upload` (`src/app/api/upload/route.ts`)
- Accepts image files and `category` form field
- Stores files in Supabase Storage bucket `images` under `<category>/` folder
- Returns full Supabase Storage public URL (e.g., `https://<ref>.supabase.co/storage/v1/object/public/images/projects/abc.png`)
- Current policy: removed/replaced image files are cleaned up from Supabase Storage when they are no longer referenced by database records
- Cleanup helper: `src/lib/media-cleanup.ts` (queries Supabase tables for references, deletes from Supabase Storage)

## Favicon / Browser Tab Icon
- File: `src/app/icon.png` (Next.js file-based metadata convention — auto-served, no metadata wiring needed)
- The default `create-next-app` favicon (`src/app/favicon.ico`) was deleted and replaced.
- Admin profile has a Browser Tab Icon uploader (stores path in `profile` table `favicon` column, handles media cleanup), but the actual tab icon is served from the static `src/app/icon.png`.
- To change the favicon: replace `src/app/icon.png` directly.
- Do NOT use `generateMetadata()` for favicon in root layout — Next.js caches the result and the icon does not update reliably.

## Contact Form Email
- Route: `src/app/api/contact/route.ts`
- Uses nodemailer SMTP (Node runtime)
- Default recipient fallback: `johnroldansasing@gmail.com`
- Requires SMTP env values (especially `SMTP_USER`, `SMTP_PASS`)
- Requires `name`, `email`, and `subject`; accepts `messageHtml` (rich HTML from RichTextEditor) or legacy `message` (plain text)
- Uses `normalizeContactMessage()` from `src/lib/contact-message-normalizers.ts` to sanitize and normalize
- Email delivers both `text:` (plain text) and `html:` parts, and sets `replyTo` to sender email
- Message sanitization allows: `p br strong em u ul ol li a` (no headings, images, or scripts)
- `CONTACT_DRY_RUN=true` is explicit opt-in only; default expectation is real SMTP send

## Environment Variables (Current Expectations)
- Supabase vars:
  - `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anon/public key — used for public reads)
  - `SUPABASE_SERVICE_ROLE_KEY` (Supabase service role key — used for admin writes, bypasses RLS)
- Contact email vars:
  - `CONTACT_TO_EMAIL`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
- Analytics vars:
  - `NEXT_PUBLIC_POSTHOG_KEY` (PostHog project API key)
  - `NEXT_PUBLIC_POSTHOG_HOST` (PostHog ingestion host, default `https://us.i.posthog.com`)

## Major UX/Feature Decisions Implemented
1. Admin image upload-first UX
- `ImageUploader` supports:
  - preview
  - `Replace Image`
  - `Remove`
  - optional manual path input
- Applied to:
  - profile photo in admin profile
  - project/certification media flows
  - project gallery-first upload and thumbnail selection

2. Auto-calculate years of experience
- Added `experienceStartYear` to `Profile`
- Added default `experienceStartYear: 2018` to profile data
- API normalizes/sanitizes this field
- Portfolio hero computes `Years of Experience` dynamically as `N+`
- If the stat is missing, it is injected at render time

3. Admin button sizing fit
- Added `admin` size variant in shared `Button` component
- Applied to admin pages and admin dialogs
- Goal: avoid cramped/overflowing rounded buttons in dashboard UI

4. Rich text for project descriptions
- Admin/projects modal uses `RichTextEditor` for the description field (bold, italic, underline, H1/H2/H3, lists, blockquotes, links, images)
- Portfolio `ProjectDetail` modal renders the stored HTML via `dangerouslySetInnerHTML` with `.bio-content` CSS class
- Backward compatible: existing plain-text descriptions render correctly in the `bio-content` div

5. Rich text for contact form message
- Contact form message field uses `RichTextEditor` with headings and images disabled, links allowed
- API accepts `messageHtml` (rich HTML) and falls back to legacy `message` (plain text) for backward compatibility
- `src/lib/contact-message-normalizers.ts` handles sanitization and HTML-to-text conversion
- Email is sent with both plain-text and HTML body

6. Managed project categories + multi-category assignments
- `project_categories` Supabase table is the ordered category source of truth
- Projects support `categories: string[]` (canonical) while keeping legacy `category` compatibility
- Admin/projects includes category CRUD + drag reorder + save
- Project add/edit supports selecting multiple categories
- Portfolio filter chips use managed category order, and clicking active chip toggles back to `All`

7. Desktop projects rail interaction update
- Desktop recent works uses native horizontal scrolling
- Left/right controls are overlaid at the rail edges (instead of heading area)

8. Contact form requirement and spacing adjustments
- Public contact form includes required sender email input (`type="email"`)
- Contact message editor min height increased to `min-h-52`
- Send button reduced from oversized custom padding to balanced sizing

9. Certification metadata and provider palette system
- Certifications support optional `credentialId`, optional `thumbnail`, and optional `paletteCode`.
- Provider color accents are resolved from organization name using one of 10 palette codes.
- Admin certifications includes palette selector (auto by provider + manual override) and single thumbnail upload.
- Public certification cards show credential ID when present and support thumbnail click-to-preview.

10. Reorder + media UX upgrades (projects/certifications)
- Admin projects now support multi-image upload and thumbnail selection from gallery images.
- Admin project ordering and certification ordering are drag-and-drop with explicit save actions.
- Added bulk reorder APIs: `/api/projects/reorder` and `/api/certifications/reorder`.
- Public Recent Works includes `Expand`/`Shrink` view mode (rail <-> grid).
- Public project and certification thumbnail cards use contained-fit image rendering to avoid crop and keep stable card height.

11. Admin media/link preview visibility
- Admin projects and certifications rows now show compact media/link status chips for quick verification (`🖼/📄/🔗`).
- Admin rows include quick-open actions for first available image/file/link.
- Certifications rows show provider palette swatch + palette code for immediate color-context visibility.
- Admin edit modals include live preview panels (images/files/links); preview opens in new tab only.

12. Recent Works rail card uniformity + confidentiality note
- Desktop Recent Works rail cards now use fixed-size frames (fixed basis + fixed height) to eliminate uneven card sizing while scrolling.
- Rail cards keep fixed category/title meta area height so content length does not affect card height.
- Added confidentiality caveat under the Recent Works heading explaining that most Power Apps and Dynamics 365 work is enterprise-confidential and only limited samples are shown.

13. PostHog analytics
- `posthog-js` installed; initialized via `PostHogProvider` in root layout (`src/app/layout.tsx`).
- Admin routes (`/admin/*`) are excluded from tracking entirely.
- `src/lib/analytics.ts` exposes a safe `capture()` wrapper (no-ops on server or if PostHog is uninitialized).
- `SectionTracker` fires `section_viewed` (once per section per page load) and `section_left` (with `dwell_seconds`) via IntersectionObserver with 30% threshold.
- Custom events: `project_card_clicked`, `project_category_filtered`, `project_view_mode_toggled`, `project_link_clicked`, `contact_form_started/submitted/success/error`.
- PostHog autocapture handles all other clicks, inputs, and external links automatically.
- Session recordings, heatmaps, and geo data available in PostHog dashboard without additional code.

## Important Files Touched Recently
- `src/lib/supabase.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/api-auth.ts`
- `src/lib/data.ts`
- `src/lib/analytics.ts`
- `src/components/analytics/PostHogProvider.tsx`
- `src/components/analytics/SectionTracker.tsx`
- `src/components/portfolio/PortfolioClient.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/portfolio/Services.tsx`
- `src/components/portfolio/Contact.tsx`
- `src/components/portfolio/Projects.tsx`
- `src/components/portfolio/ProjectDetail.tsx`
- `src/components/ui/Button.tsx`
- `src/components/admin/ImageUploader.tsx`
- `src/components/admin/MultiImageUploader.tsx`
- `src/components/admin/RichTextEditor.tsx`
- `src/app/admin/profile/page.tsx`
- `src/app/admin/projects/page.tsx`
- `src/app/admin/certifications/page.tsx`
- `src/app/admin/services/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/components/admin/DeleteDialog.tsx`
- `src/components/portfolio/HeroAbout.tsx`
- `src/app/api/profile/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/reorder/route.ts`
- `src/app/api/project-categories/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/certifications/route.ts`
- `src/app/api/certifications/[id]/route.ts`
- `src/app/api/certifications/reorder/route.ts`
- `src/lib/types.ts`
- `src/lib/certification-palettes.ts`
- `src/lib/project-normalizers.ts`
- `src/lib/admin-preview.ts`
- `src/lib/project-category-normalizers.ts`
- `src/lib/contact-message-normalizers.ts`
- `src/lib/media-cleanup.ts`
- `data/profile.json`
- `data/projects.json`
- `data/project-categories.json`
- `data/certifications.json`
- `.codex/skills/portfolio-maintainer/SKILL.md`
- `.codex/skills/portfolio-maintainer/agents/openai.yaml`
- `.codex/skills/portfolio-maintainer/references/*`
- `README.md`
- `src/app/icon.png`
- `src/app/page.tsx`
- `src/app/api/upload/route.ts`
- `next.config.ts`
- `scripts/supabase-migration.sql`
- `scripts/setup-supabase.ts`
- `scripts/migrate-to-supabase.ts`
- `scripts/create-admin-user.ts`
- `src/proxy.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/admin/login/page.tsx`
- `src/components/admin/Sidebar.tsx`

## Known Issues / Caveats
- `npm run lint` currently fails on existing rule `react-hooks/set-state-in-effect` in multiple files:
  - `src/app/admin/certifications/page.tsx`
  - `src/app/admin/profile/page.tsx`
  - `src/app/admin/projects/page.tsx`
  - `src/app/admin/services/page.tsx`
  - `src/hooks/usePreloader.ts`
- These are pre-existing lint-policy issues and not runtime blockers for current features.
- **Favicon via `generateMetadata()` is unreliable**: Next.js aggressively caches root layout metadata. Using `export const dynamic = "force-dynamic"` forces all pages to dynamic rendering (unacceptable perf cost). The file-based `src/app/icon.png` convention is the only reliable method for favicons in Next.js App Router. The admin favicon uploader field (`profile.favicon`) is retained for media cleanup but does NOT drive the actual browser tab icon.

## Practical Notes for Future Sessions
- All data is now in Supabase. Do NOT read/write `data/*.json` at runtime; those files are legacy references only.
- Data layer: `src/lib/data.ts` exposes entity-specific functions (e.g., `getProjects()`, `updateProfile()`, `createCertification()`). API routes use these instead of `readJsonFile`/`writeJsonFile`.
- Image URLs stored in the database are full Supabase Storage public URLs. Components render them directly via `<img>` or `next/image`.
- For admin media features, reuse `ImageUploader` and `/api/upload` first.
- Media cleanup is automatic on profile/projects/services/certifications update/delete routes; unreferenced images are deleted from Supabase Storage.
- For profile changes, ensure `src/lib/types.ts`, Supabase `profile` table, admin UI, and `/api/profile` stay aligned.
- `next.config.ts` has `remotePatterns` configured for the Supabase Storage hostname. If the project is moved to a different Supabase instance, update this.
- Contact form submissions are stored in `contact_submissions` table in addition to sending SMTP email.

## Change Log
### 2026-02-19 (UI Spacing and Typography Pass)
- Reduced hero name font size: `clamp(1.75rem, 5.5vw, 3.6rem)` desktop / `clamp(1.6rem, 8vw, 2.4rem)` mobile
- Removed `.portfolio-section` CSS padding rule from `globals.css`; section vertical spacing now managed per-component
- Removed `margin: 0; padding: 0;` from global `*` reset; relying on Tailwind preflight only
- Increased spacing between service cards: `space-y-8 md:space-y-10`
- Increased service card internal padding: `px-6 py-7 md:px-8 md:py-8` and row gap: `gap-6 md:gap-10`
- Increased Contact submit button padding: `px-16 py-[1.875rem]`
- Updated `DESIGN_SYSTEM.md` to reflect all spacing and typography changes

### 2026-02-19
- Added `experienceStartYear` to profile model and API normalization
- Implemented auto-calculated `Years of Experience` (`N+`) in hero stats
- Upgraded admin `ImageUploader` to support preview + replace + remove + optional manual path
- Updated admin projects gallery to uploader-first rows
- Added admin-specific button size and applied it across admin pages/dialogs
- Wired contact form to SMTP email delivery with nodemailer and env-based config
- Improved auth login compatibility for hashed and plain env password values
- Added project context file (`CLAUDE.md`) for future handoff/reference

### 2026-02-20
- Added rich text editing for project descriptions: admin/projects modal now uses `RichTextEditor`; portfolio `ProjectDetail` renders HTML with `.bio-content`
- Added rich text contact form message: contact form message field replaced with `RichTextEditor` (headings/images disabled, links allowed)
- Added `src/lib/contact-message-normalizers.ts`: sanitizes and normalizes HTML/plain-text message input; used by contact API
- Updated contact API to accept `messageHtml`, normalize/sanitize it, and send both text+html email parts
- Extended `RichTextEditor` with optional `allowHeadings`, `allowImage`, `allowLinks`, `minHeightClassName` props

### 2026-02-20 (Categories + Projects Rail + Contact Validation)
- Added managed project categories data model and API: `data/project-categories.json`, `src/app/api/project-categories/route.ts`, `src/lib/project-category-normalizers.ts`
- Extended project normalization to support canonical `categories[]` with legacy `category` fallback compatibility
- Updated admin projects: sortable category manager, multi-category selection in create/edit form, category table display as joined labels
- Updated public projects: filter chips sourced from managed categories, active-chip toggle-to-`All`, desktop native horizontal rail with overlay edge navigation controls
- Contact form now requires sender email, validates it server-side, includes email in message payload, and sets SMTP `replyTo`
- Contact UI tweaks: message editor min height `min-h-52`, send button reduced to balanced size

### 2026-02-20 (Certification Provider Palette + Thumbnail + Credential ID)
- Added certification palette system with 10 provider palette codes and provider-based auto mapping (`src/lib/certification-palettes.ts`).
- Extended certifications data model with optional `credentialId`, `thumbnail`, and `paletteCode`.
- Updated certifications API POST/PUT/GET normalization for `credentialId`, `thumbnail`, `paletteCode`.
- Updated admin certifications form: credential ID field, provider palette selector, and single thumbnail upload.
- Updated public certifications cards: neutral year badge, provider palette accents, optional credential ID display, and thumbnail click-to-preview modal.

### 2026-02-21 (Recent Works Consistency + Skill/Docs Consolidation)
- Updated Recent Works cards to keep consistent visual height rhythm using category/title clamp classes.
- Updated project detail modal gallery to use deduped `thumbnail + gallery[]` image list with full-image (`object-contain`) viewing and stable viewer height.
- Fixed project category separator rendering to proper bullet (`•`) in modal and cards.
- Replaced boilerplate `README.md` with project-specific runbook, env semantics, and feature/data map.
- Added repo-local skill `.codex/skills/portfolio-maintainer` with references for architecture, data contracts, UI rules, and release checklist.

### 2026-02-21 (Projects/Certifications Media + Reorder UX)
- Added `MultiImageUploader` and switched admin projects to gallery-first multi-image upload.
- Added thumbnail picker from project gallery with safe fallback when thumbnail image is removed.
- Added drag-and-drop ordering with explicit save for projects and certifications.
- Added reorder APIs: `PUT /api/projects/reorder` and `PUT /api/certifications/reorder`.
- Added Recent Works `Expand`/`Shrink` mode to switch between horizontal rail and grid layouts.
- Updated project and certification thumbnails to use full image contain-fit in fixed media containers.

### 2026-02-21 (Media Cleanup Policy Update)
- Added `src/lib/media-cleanup.ts` to detect references across profile/projects/services/certifications and rich HTML image sources.
- Wired cleanup calls into API write/delete routes:
  - `src/app/api/profile/route.ts`
  - `src/app/api/projects/[id]/route.ts`
  - `src/app/api/services/route.ts`
  - `src/app/api/certifications/[id]/route.ts`
- Executed one-time orphan cleanup and sanitized data references to avoid broken image paths.

### 2026-02-22 (Admin Preview Enhancements)
- Added shared admin preview helpers in `src/lib/admin-preview.ts` for safe preview URL normalization and preview source collection.
- Updated admin projects row UI with mini image preview, media/link count chips, and quick-open actions.
- Updated admin projects modal with per-link open action and consolidated Preview panel (images/files/links).
- Updated admin certifications row UI with mini thumbnail, provider palette swatch + code, media/link chips, and quick-open actions.
- Updated admin certifications modal with live Preview panel (thumbnail, palette, credential link, files).

### 2026-02-22 (PostHog Analytics Integration)
- Installed `posthog-js` package.
- Added `src/lib/analytics.ts`: safe PostHog `capture()` wrapper (server-safe, silent on uninitialized).
- Added `src/components/analytics/PostHogProvider.tsx`: initializes PostHog in root layout; skips entirely on `/admin/*` routes; guards with `posthog.__loaded` to prevent double-init.
- Added `src/components/analytics/SectionTracker.tsx`: IntersectionObserver fires `section_viewed` (once per section) and `section_left` (with `dwell_seconds`) for all 5 portfolio sections.
- Updated `src/components/portfolio/Projects.tsx`: fires `project_card_clicked`, `project_category_filtered`, `project_view_mode_toggled` on all card variants (grid/mobile/rail).
- Updated `src/components/portfolio/ProjectDetail.tsx`: fires `project_link_clicked` on external project links.
- Updated `src/components/portfolio/Contact.tsx`: fires `contact_form_started` on first field interaction, `contact_form_submitted`, `contact_form_success`, `contact_form_error`.
- Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env`.

### 2026-02-22 (Recent Works Rail Uniformity)
- Updated `src/components/portfolio/Projects.tsx` with rail-only fixed card wrapper sizing and rail-specific card mode.
- Added confidentiality caveat text block below Recent Works heading.
- Added rail layout helper classes in `src/app/globals.css` (`.project-card-rail`, `.project-card-rail__media`, `.project-card-rail__meta`).

### 2026-02-22 (Favicon / Browser Tab Icon)
- Deleted default Next.js `src/app/favicon.ico` (Vercel triangle icon that shipped with `create-next-app`).
- Placed JRS logo as `src/app/icon.png` — Next.js file-based metadata convention auto-serves it as the browser tab icon.
- Added optional `favicon` field to `Profile` interface in `src/lib/types.ts` and normalizer in `src/lib/profile-normalizers.ts`.
- Added Browser Tab Icon uploader card to admin profile page (`src/app/admin/profile/page.tsx`) with `ImageUploader`.
- Updated `src/lib/media-cleanup.ts` to track favicon as a referenced image path.
- Updated `src/app/api/profile/route.ts` to clean up old favicon image on replacement.
- Reverted `src/app/layout.tsx` to static `metadata` export (removed `generateMetadata()` and `force-dynamic` — dynamic metadata was unreliable for favicons due to Next.js caching; the file-based `icon.png` approach is more reliable).
- **Caveat**: The admin favicon uploader stores the path in the `profile` table `favicon` column and handles media cleanup, but the actual browser tab icon is served from the static `src/app/icon.png` file. To change the favicon, replace `src/app/icon.png` directly. A future improvement could wire the admin-uploaded favicon to overwrite `src/app/icon.png` at save time.

### 2026-02-22 (Supabase Migration)
- Migrated entire data layer from local JSON files (`data/*.json`) + filesystem images (`public/images/`) to Supabase Postgres + Supabase Storage.
- Installed `@supabase/supabase-js`.
- Created `src/lib/supabase.ts` with public (anon) and admin (service_role) clients plus Storage URL helpers.
- Rewrote `src/lib/data.ts` from generic `readJsonFile`/`writeJsonFile` to entity-specific CRUD functions (`getProfile`, `updateProfile`, `getProjects`, `createProject`, `updateProject`, `deleteProject`, `reorderProjects`, `getProjectCategories`, `updateProjectCategories`, `getServices`, `updateServices`, `getCertifications`, `createCertification`, `updateCertification`, `deleteCertification`, `reorderCertifications`, `createContactSubmission`). Internal snake_case ↔ camelCase mappers handle DB row conversion.
- Rewrote `src/app/api/upload/route.ts` to upload files to Supabase Storage bucket `images` and return full public URLs.
- Rewrote `src/lib/media-cleanup.ts` to query Supabase tables for referenced images and delete orphans from Supabase Storage.
- Updated all API routes (`profile`, `projects`, `projects/[id]`, `projects/reorder`, `project-categories`, `services`, `certifications`, `certifications/[id]`, `certifications/reorder`) to use new data layer functions.
- Updated `src/app/api/contact/route.ts` to store contact form submissions in `contact_submissions` table in addition to sending SMTP email.
- Updated `src/app/page.tsx` to fetch data from Supabase via data layer functions.
- Updated `next.config.ts` with `remotePatterns` for Supabase Storage hostname.
- Created SQL migration (`scripts/supabase-migration.sql`): 6 tables, RLS policies (public read + service_role full), Storage bucket + policies.
- Created setup script (`scripts/setup-supabase.ts`): creates Storage bucket, verifies table existence.
- Created data migration script (`scripts/migrate-to-supabase.ts`): seeds all existing JSON data into Supabase tables and uploads 40 local images to Supabase Storage with URL rewriting.
- Added env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Updated all documentation files (`CLAUDE.md`, `README.md`, `DESIGN_SYSTEM.md`, `.codex/skills/portfolio-maintainer/*`).

### 2026-02-22 (Supabase Auth Migration)
- Migrated admin authentication from env-var + custom JWT to Supabase Auth (email + password).
- Installed `@supabase/ssr` for cookie-based server auth.
- Created `src/lib/supabase-browser.ts` (client-side Supabase instance via `createBrowserClient`).
- Updated `src/lib/supabase.ts` with `createSupabaseServerClient()` using `createServerClient` + `cookies()`.
- Rewrote `src/app/api/auth/login/route.ts` to use `supabase.auth.signInWithPassword()`.
- Created `src/app/api/auth/logout/route.ts` with `supabase.auth.signOut()`.
- Rewrote `src/lib/api-auth.ts`: `authenticateRequest()` now verifies Supabase session via `getUser()` (no `req` param).
- Rewrote `src/proxy.ts` middleware to use Supabase session verification instead of custom JWT.
- Updated `src/app/admin/login/page.tsx` with email + password fields.
- Updated `src/components/admin/Sidebar.tsx` logout to call `POST /api/auth/logout`.
- Deleted `src/lib/auth.ts` (bcrypt + jose no longer needed).
- Removed `bcryptjs`, `jose`, `@types/bcryptjs` dependencies.
- Commented out `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `password` env vars.
- Created `scripts/create-admin-user.ts` for one-time admin user provisioning.
- Updated all API routes: `authenticateRequest(req)` -> `authenticateRequest()`.

### Template For Next Entries
- `YYYY-MM-DD`
  - short summary of feature/fix
  - key files touched
  - known caveats follow-up

