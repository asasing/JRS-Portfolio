# Data Contracts Reference

## Profile
- Type: `Profile`
- Bio stored as sanitized HTML string.
- Skills stored as ordered `string[]`.

## Projects
- Type: `Project`
- Categories:
- canonical: `categories?: string[]`
- legacy mirror: `category: string`
- Thumbnail must never be empty at render time (fallback constant).

## Project Categories
- Source file: `data/project-categories.json`
- Ordered list drives public filter chips and admin category manager.

## Certifications
- Type: `Certification`
- Optional metadata:
- `credentialId?: string`
- `thumbnail?: string`
- `paletteCode?: string`
- Palette resolves by provider mapping unless explicitly overridden.

## Contact Payload
- Required: `name`, `email`, `subject`
- Message input: `messageHtml` preferred, `message` fallback accepted
- Always sanitize server-side before email send.