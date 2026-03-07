# AGENTS.md

## Cursor Cloud specific instructions

### Quick reference
- **Install deps:** `npm install`
- **Dev server:** `npm run dev` (starts on port 3000)
- **Lint:** `npm run lint` (3 pre-existing `react-hooks/set-state-in-effect` errors — these are known and not runtime blockers, see `CLAUDE.md` "Known Issues")
- **Build:** `npm run build`
- See `CLAUDE.md` for full architecture, data contracts, and change log.
- See `README.md` for env var list and Supabase setup steps.

### Environment variables
A `.env` file must exist at the repo root. The app requires three Supabase variables to start:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Without real Supabase credentials the dev server will start, but the public portfolio page (`/`) will 500 because the home page server component fetches data from Supabase at request time. Admin pages that don't fetch data on load (e.g. `/admin/login`) will render normally.

Set `CONTACT_DRY_RUN=true` to skip SMTP when testing locally.

### Gotchas
- **No test framework:** This project has no automated test suite (no Jest, Vitest, Playwright, or Cypress). `npm run lint` is the only automated check.
- **Middleware deprecation warning:** Next.js 16 shows `The "middleware" file convention is deprecated. Please use "proxy" instead.` This is cosmetic and does not affect functionality.
- **No Docker:** The project is a pure Node.js/Next.js app with no Docker or docker-compose configuration. External services (Supabase) are cloud-hosted.
- **`sharp` native module:** `npm install` builds `sharp` from source. If you see build errors on a new platform, ensure `libvips` build dependencies are available, or let npm handle the prebuilt binary.
