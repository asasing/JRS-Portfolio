# UI Rules Reference

## Section Rhythm
- Keep section spacing consistent and non-cramped.
- Use shared separator and chip utilities from `globals.css`.

## Recent Works
- Keep card heights visually uniform:
- stable image aspect ratio
- clamped category/title text
- avoid variable card growth from long text
- Full image viewing should happen in modal, not inline card expansion.

## Project Modal Image Viewer
- Build image list from thumbnail + gallery, trimmed/deduped.
- Use `object-contain` for full image visibility.
- Keep stable image viewer height to reduce layout jump.

## Buttons and Chips
- Use `.pill-button` for compact filter chips.
- Keep minimum touch-friendly target size.
- Avoid text looking cramped inside CTA buttons.

## Contact
- Required fields: Name, Email, Subject.
- Message editor allows simple rich formatting only.
- Surface clear status/error messaging from API response.

## Certifications
- Provider-driven palette accents.
- Optional thumbnail preview and credential ID rendering.