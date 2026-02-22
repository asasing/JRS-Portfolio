---
name: portfolio-maintainer
description: Maintain and evolve the JRS portfolio codebase across public UI, admin UI, Supabase data layer, API normalization, and PostHog analytics. Use when modifying Hero/Services/Projects/Certifications/Contact behavior, category/filter logic, media handling, contact SMTP semantics, analytics event tracking, or when syncing implementation changes with DESIGN_SYSTEM.md, CLAUDE.md, and README.md.
---

# Portfolio Maintainer

Execute portfolio changes with data-contract/API/admin/public/doc consistency.

## Core Principles
- Keep `types -> normalizers -> data layer -> API -> admin form -> public render` aligned.
- Prefer shared normalizers/constants over duplicated per-route logic.
- Data lives in Supabase (Postgres tables + Storage bucket). Do NOT read/write `data/*.json` at runtime.
- Images are stored in Supabase Storage bucket `images` and referenced by full public URLs in the database.
- Update docs whenever behavior or UI policy changes.

## Standard Workflow
1. Inspect impacted model in `src/lib/types.ts`.
2. Update relevant normalizer(s) in `src/lib/*-normalizers.ts`.
3. Update data layer functions in `src/lib/data.ts` (Supabase CRUD + row mappers).
4. Update API route(s) under `src/app/api/*`.
5. Update admin editor flow under `src/app/admin/*`.
6. Update public renderer under `src/components/portfolio/*`.
7. Update docs:
- `README.md`
- `DESIGN_SYSTEM.md`
- `CLAUDE.md`
8. Verify:
- `npm run build`
- `npm run lint` (do not worsen baseline)

## Feature Policies
- Projects:
- Category chips must come from managed ordered categories.
- Clicking active chip toggles back to `All`.
- Keep Recent Works cards visually uniform (clamped text, stable card rhythm).
- Keep full-image viewing in modal (thumbnail + gallery deduped and sanitized).

- Certifications:
- Use provider-based palette codes (10-code set).
- Support optional `credentialId` and `thumbnail`.
- Keep year badge neutral (no manual per-year color coding).

- Contact:
- Treat success as real SMTP send unless explicit dry-run.
- Keep server-side sanitization for public rich message input.
- Return clear validation/config/send error messages.

## References
- Architecture: `references/architecture.md`
- Data contracts: `references/data-contracts.md`
- UI rules: `references/ui-rules.md`
- Release checklist: `references/release-checklist.md`