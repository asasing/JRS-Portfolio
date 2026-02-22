# Release Checklist

1. Types and normalizers
- Confirm `src/lib/types.ts` matches saved JSON shape.
- Confirm normalizers cover legacy + new fields.

2. API behavior
- Validate GET/POST/PUT/PATCH response consistency.
- Confirm error codes/messages are explicit and safe.

3. Admin + Public sync
- Admin add/edit/delete/reorder persists.
- Public render reflects persisted data accurately.

4. Media safety
- No `next/image` missing/empty `src` at runtime.
- Fallback images render for invalid/blank media paths.

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