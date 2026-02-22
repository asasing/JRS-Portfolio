# Release Checklist

1. Types and data layer
- Confirm `src/lib/types.ts` matches Supabase table shape.
- Confirm `src/lib/data.ts` row mappers handle all fields.
- Confirm normalizers cover legacy + new fields.

2. API behavior
- Validate GET/POST/PUT/PATCH response consistency.
- Confirm error codes/messages are explicit and safe.

3. Admin + Public sync
- Admin add/edit/delete/reorder persists to Supabase.
- Public render reflects persisted data accurately.

4. Media safety
- No `next/image` missing/empty `src` at runtime.
- Fallback images render for invalid/blank media paths.
- `next.config.ts` `remotePatterns` includes Supabase Storage hostname.

5. UX checks
- Recent Works cards remain uniform.
- Project modal images show full content and navigate correctly.
- Contact form validates required fields.

6. Docs
- Update `README.md`, `DESIGN_SYSTEM.md`, `CLAUDE.md` if behavior changed.

7. Verification
- Run `npm run build`.
- Run `npm run lint`; note baseline issues separately.

8. Analytics
- Confirm PostHog is NOT firing events on `/admin/*` routes.
- Confirm custom events appear in PostHog Live Events dashboard after interactions.
- If new interactive components are added: wire `capture()` calls using `src/lib/analytics.ts`.
- If new public env vars are added: document in `CLAUDE.md`, `DESIGN_SYSTEM.md`, and `README.md`.

9. Supabase
- Confirm all Supabase env vars are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- If schema changed: update `scripts/supabase-migration.sql` and run new DDL in Supabase Dashboard.
- If new table added: add RLS SELECT policy for `anon` role.
