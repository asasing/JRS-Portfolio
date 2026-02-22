# Data Contracts Reference

## Data Layer
- All data is stored in Supabase Postgres tables.
- `src/lib/data.ts` provides entity-specific CRUD functions.
- Internal row mappers convert between snake_case DB columns and camelCase TypeScript types.
- Images are stored in Supabase Storage bucket `images` and referenced by full public URLs.

## Profile
- Type: `Profile`
- DB table: `profile` (singleton, id = 'default')
- Bio stored as sanitized HTML string.
- Skills stored as ordered `string[]` (JSONB column).

## Projects
- Type: `Project`
- DB table: `projects` (ordered by `sort_order`)
- Categories:
  - canonical: `categories?: string[]` (JSONB column)
  - legacy mirror: `category: string`
- Thumbnail must never be empty at render time (fallback constant).

## Project Categories
- Type: `ProjectCategory`
- DB table: `project_categories` (ordered by `sort_order`)
- Ordered list drives public filter chips and admin category manager.

## Services
- Type: `Service`
- DB table: `services` (ordered by `sort_order`)

## Certifications
- Type: `Certification`
- DB table: `certifications` (ordered by `sort_order`)
- Optional metadata:
  - `credentialId?: string` (DB: `credential_id`)
  - `thumbnail?: string`
  - `paletteCode?: string` (DB: `palette_code`)
- Palette resolves by provider mapping unless explicitly overridden.

## Contact Submissions
- DB table: `contact_submissions`
- Stored on every valid contact form submission (in addition to SMTP email).
- Fields: `name`, `email`, `subject`, `message_text`, `message_html`, `created_at`.

## Contact Payload (API)
- Required: `name`, `email`, `subject`
- Message input: `messageHtml` preferred, `message` fallback accepted
- Always sanitize server-side before email send.
