# JRS Portfolio - Design System

This document is the source of truth for visual design decisions in the portfolio and admin UI.

## Design Philosophy

- Dark-first: pure dark background (`#0a0a0a`), no light mode.
- Minimalistic: generous whitespace and restrained accent usage.
- Modern: clean typography, subtle motion, gradient accents.
- Consistent: cards, controls, and interaction states share one token system.
- Framework: Tailwind CSS only (no Bootstrap).

---

## Color Palette

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#0a0a0a` | Page background |
| `bg-card` | `#1a1a1a` | Cards, panels |
| `bg-card-hover` | `#222222` | Card hover surface |
| `bg-input` | `#111111` | Input backgrounds |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#ffffff` | Headings, key content |
| `text-secondary` | `#a0a0a0` | Body text |
| `text-muted` | `#666666` | Labels, captions |

### Borders
| Token | Hex | Usage |
|---|---|---|
| `border-subtle` | `#2a2a2a` | Dividers, card/input borders |

### Accent Colors
| Token | Hex | Usage |
|---|---|---|
| `accent-purple` | `#8b5cf6` | Primary accent, active states |
| `accent-magenta` | `#d946ef` | Gradient end accent |
| `accent-pink` | `#ec4899` | Error/destructive accents |
| `glow-cyan` | `#06b6d4` | Profile glow ring |
| `year-green` | `#10b981` | Success states |

### Gradients
```css
gradient-accent: linear-gradient(135deg, #8b5cf6, #d946ef);
gradient-menu: linear-gradient(180deg, #1a0a2e 0%, #3b0764 50%, #0a0a0a 100%);
gradient-glow: conic-gradient(#06b6d4, #8b5cf6, #d946ef, #06b6d4);
```

---

## Typography

### Font Families
| Token | Font | Source | Usage |
|---|---|---|---|
| `font-sans` | Inter | Google Fonts | Body/UI text |
| `font-mono` | JetBrains Mono | Google Fonts | Hero name (code style), service numbers |
| `font-script` | Dancing Script | Google Fonts | Optional decorative accents only |

### Font Sizes
| Token | Size | Usage |
|---|---|---|
| Hero name | `clamp(1.75rem, 5.5vw, 3.6rem)` | Main hero title |
| Section heading | `text-4xl md:text-5xl lg:text-6xl` | Section titles |
| Stat number | `text-4xl md:text-5xl` | Stats counters |
| Card title | `text-base md:text-lg` | Card headings |
| Body | `text-sm` | Paragraphs/descriptions |
| Label | `text-xs` | Overline/caption text |

### Text Patterns
- Gradient word in section headings uses `.gradient-text`.
- Overline labels use uppercase tracking with a small accent dot.
- Skills list in hero is joined by `" | "`.

---

## Spacing System

| Token | Value | Usage |
|---|---|---|
| Section separator gap | `clamp(2.2rem, 4.5vw, 3.6rem)` | `.section-separator` |
| Compact chip padding | `0.7rem 1.1rem` mobile / `0.78rem 1.35rem` sm+ | `.pill-button` |
| Compact chip min-height | `2.7rem` mobile / `2.9rem` sm+ | `.pill-button` |
| Card padding | `p-6` baseline | Internal card spacing |
| Content width | `.site-container` | Responsive max width container |

> **Note:** `.portfolio-section` padding is no longer defined in `globals.css`. Section vertical spacing is handled per-component via Tailwind utilities.

### CSS Reset
The global `*` selector only enforces `box-sizing: border-box`. Margin/padding resets are handled by Tailwind's preflight.

---

## Components

### Buttons

Variants:
1. Gradient: `bg-gradient-to-r from-accent-purple to-accent-magenta text-white rounded-full`
2. Outline: `border border-border-subtle text-text-primary rounded-full`

Shared `Button` sizes:
- `sm`: `px-6 py-3`
- `md`: `px-9 py-4`
- `lg`: `px-12 py-5`
- `admin`: `px-6 py-3`

Notes:
- Contact submit uses `md` sizing with `px-10 py-4` for balanced weight.
- Compact project filter chips use `.pill-button`.

### Cards
- Background: `bg-bg-card`
- Border: `border border-border-subtle`
- Radius: `rounded-xl` to `rounded-2xl` depending on section
- Hover: subtle border/surface elevation (`hover:border-accent-purple/...`, optional `hover:bg-bg-card-hover/...`)
- Transition: `transition-all duration-500`

### Inputs
- Background: `bg-bg-input`
- Border: `border border-border-subtle`
- Focus: `focus:border-accent-purple`
- Radius: `rounded-lg`
- Padding: `px-4 py-3`

### Badges
- Pill shape: `px-3 py-1 rounded-full text-xs`
- Dynamic color via inline style with 20% alpha background.

### Certification Provider Palettes
- Certifications use provider-based palettes (`paletteCode`) instead of manual year color coding.
- Available palette codes:
  - `provider-blue`
  - `provider-cyan`
  - `provider-green`
  - `provider-emerald`
  - `provider-amber`
  - `provider-orange`
  - `provider-red`
  - `provider-rose`
  - `provider-violet`
  - `provider-slate`
- Provider maps automatically by organization name; admin can override.

### Section Heading Pattern
```
[accent dot] OVERLINE (uppercase, tracked)
Title with one gradient-highlighted word
```

### Hero Title
- Code-style mono heading using JetBrains Mono.
- React-driven one-shot typewriter effect.
- Blinking caret cursor after typing completes.
- Reduced motion preference shows full text immediately.

### Rich Text Editor (`RichTextEditor`)
- TipTap-based editor (`@tiptap/react`, `starter-kit`, `extension-underline`, `extension-link`, `extension-image`)
- Used in: admin bio, admin project description, contact form message field
- Props:
  - `allowHeadings?: boolean` — enables H1/H2/H3 buttons (default `true`)
  - `allowImage?: boolean` — enables image upload button (default `true`)
  - `allowLinks?: boolean` — enables link/unlink buttons (default `true`)
  - `minHeightClassName?: string` — Tailwind min-height class for the editor area (default `"min-h-48"`)
- Output: HTML string stored and served as-is
- Rendered in portfolio with `.bio-content` CSS class (see `globals.css`)
- Contact form variant: `allowHeadings={false}` `allowImage={false}` `allowLinks` `minHeightClassName="min-h-52"`

### Services Icons
Supported icon source values:
- Font Awesome key (for example `FaCode`)
- Uploaded image path (for example `/images/services/...`)

---

## Motion

| Name | Duration | Trigger | Description |
|---|---|---|---|
| Hero typewriter | ~70ms per character | Initial hero render | Reveals hero name character-by-character |
| Hero cursor blink | 1s infinite | Hero title | Blinking caret |
| `glow-spin` | 3s linear infinite | Always | Rotating profile glow ring |
| Preloader letters | 0.4s staggered | App load | Letter fade/slide reveal |
| Preloader exit | 0.5s | After preloader delay | Fade out preloader |
| Scroll reveal | 0.7s | Intersection observer | Fade in with upward movement |
| Count up | 2s ease-out | Intersection observer | Number increment animation |
| Card hover | 0.5s | Hover | Border/surface emphasis |

---

## Layout Patterns

### Hero (3-column desktop)
```
[Left: About/Skills/Connect] [Center: GlowPhoto] [Right: Stats]
         Full-width code-style typed name above all columns
```

### Services
```
[Number + Icon + Title | Description]
[Number + Icon + Title | Description]
[Number + Icon + Title | Description]
```

### Projects
```
[Managed category chips, multi-category filter]
[Rail default + Expand/Shrink toggle]
[Cards grid on mobile/tablet and expanded desktop view]
[Native horizontal rail on desktop with overlay edge arrows]
```

- Filter chips are driven by admin-managed project categories (`project-categories.json`).
- Clicking an already active category toggles back to `All`.
- View mode defaults to horizontal rail; `Expand` switches to grid and `Shrink` restores rail mode.
- Desktop rail supports native horizontal scroll (trackpad/wheel/swipe) plus left/right overlay controls.
- Recent Works cards keep uniform rhythm:
- fixed media ratio (`aspect-[4/3]`)
- single-line category clamp
- two-line title clamp
- Desktop rail cards use fixed card frames for uniform scrolling rhythm:
- fixed rail basis/width per breakpoint (`340/360/380`)
- fixed rail card height (`420/440`)
- fixed meta block height so long/short content does not change card height
- Recent Works includes a confidentiality caveat directly below the heading:
- “Most Power Apps and Dynamics 365 projects are confidential enterprise engagements, so only a limited selection can be shown.”
- Full image viewing is modal-first:
- cards do not expand inline to show full images
- modal image list uses `thumbnail + gallery[]` (trimmed, deduped, non-empty)
- modal main image uses full-fit rendering (`object-contain`)

### Certifications
```
Responsive card grid with neutral year badge, provider palette accents, optional credential ID/link, and optional thumbnail with image preview
```
- Certification thumbnails use contained-fit rendering (`object-contain`) inside a fixed-height media area to keep card heights stable.

### Contact
```
[Heading + contact info]
[Name] [Email] [Subject]
[Rich text message (bold/italic/underline/lists/links; no headings or images)]
[SEND MESSAGE ->]
```

- `Email` and `Subject` are required in the form and server validation.
- Message editor minimum height for contact is `min-h-52`.
- Real SMTP sending is default behavior; dry-run requires explicit `CONTACT_DRY_RUN=true`.

---

## Favicon / Browser Tab Icon

- File: `src/app/icon.png` (Next.js file-based metadata — auto-served at `/icon.png`)
- JRS logo on dark background, 1024x1024 PNG.
- To replace: swap `src/app/icon.png` with a new image file. Next.js picks it up automatically on restart.
- Do NOT use a `favicon.ico` in `src/app/` alongside `icon.png` — browsers prioritize `.ico` over `.png`. Keep only one.
- Do NOT use `generateMetadata()` to set favicon dynamically — Next.js caches root layout metadata and the icon will not update.

---

## Navigation

### Header (fixed)
```
[JRS logo]                    [LET'S TALK] [MENU]
```

### Menu Overlay
```
[CLOSE]
About
Services
Portfolio
Certifications
Contact
```

Anchors: `#about`, `#services`, `#portfolio`, `#certifications`, `#contact`.

---

## Admin Dashboard

### Layout
```
[Sidebar 256px] [Main content area]
```

### Styling
- Same dark token system as portfolio.
- Shared form controls and button component.
- Table/list rows use subtle hover feedback.
- Projects and certifications ordering use drag-and-drop rows with explicit `Save Order` actions.
- Project media management is gallery-first with multi-upload and thumbnail selection from uploaded gallery images.
- Admin rows and modals include compact media/link preview affordances:
  - Projects: mini thumbnail + `🖼/📄/🔗` chips + quick open links.
  - Certifications: mini thumbnail + provider palette swatch/code + `🖼/📄/🔗` chips + quick open links.
  - Preview actions always open in a new tab (`target="_blank"` + `rel="noopener noreferrer"`).
  - `attachments` preview is conditional and shown only when data exists.
- Media lifecycle policy: when image references are removed in admin data, unreferenced files are automatically cleaned from `public/images` (default placeholders are protected).

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | `< 768px` | Stacked layouts, smaller title scale |
| Tablet | `>= 768px` | 2-column patterns where needed |
| Desktop | `>= 1024px` | Hero 3-column, desktop project slider |
| Wide | `>= 1440px` | Constrained centered content width |

---

## Analytics

- Provider: PostHog (`posthog-js`)
- Initialized in: `src/components/analytics/PostHogProvider.tsx` (wrapped in root layout)
- Admin exclusion: PostHog is NOT initialized on `/admin/*` routes
- Event capture helper: `src/lib/analytics.ts` → `capture(event, props?)`

### Automatic (PostHog built-in)
- `$pageview` — every page load
- `$pageleave` — session duration / exit page
- `$autocapture` — all clicks, form inputs, external links
- Session recordings, heatmaps, and user geo data available in PostHog dashboard

### Custom Events
| Event | Trigger | Properties |
|---|---|---|
| `section_viewed` | Section enters viewport (30% threshold, first time) | `section` |
| `section_left` | Section exits viewport | `section`, `dwell_seconds` |
| `project_card_clicked` | Project card click (grid, mobile, rail) | `project_id`, `project_title`, `categories` |
| `project_category_filtered` | Filter chip clicked | `category` |
| `project_view_mode_toggled` | Rail ↔ Grid toggle | `mode` |
| `project_link_clicked` | External project link in modal | `project_id`, `project_title`, `link_label` |
| `contact_form_started` | First keystroke in any contact field | — |
| `contact_form_submitted` | Form submit pressed | — |
| `contact_form_success` | Server returned 200 | — |
| `contact_form_error` | Server/network error | `error_message` |

### Environment Variables
- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog ingestion host (default: `https://us.i.posthog.com`)

---

## File References

- Browser tab icon: `src/app/icon.png`
- Design tokens and utilities: `src/app/globals.css`
- Font loading: `src/app/layout.tsx`
- Portfolio components: `src/components/portfolio/*`
- Analytics components: `src/components/analytics/*`
- Analytics capture helper: `src/lib/analytics.ts`
- Data models: `src/lib/types.ts`
- Content data: `data/*.json`

---

## Admin Default Credentials

- Password: `admin123` (change in production)
- Login URL: `/admin/login`
- Password hash stored in `.env` as `ADMIN_PASSWORD_HASH`
- Change password command:
  `node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 10).then(h => console.log(h))"`
