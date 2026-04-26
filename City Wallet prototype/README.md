# City Wallet — Design System

> Sparkassen-Finanzgruppe (DSV-Gruppe) · Hackathon "Generative City Wallet"
> Heritage: Otl Aicher (1972) → LIGALUX redesign (2022, iF Award)

A generative, context-aware wallet for the German Savings Banks. Real-time signals — weather, location, time, local events, Payone transaction density — are fused on-device to surface a single, high-relevance offer at the right moment. The product lives on a phone in someone's hand during a 12-minute lunch break.

## Sources

- `uploads/DESIGN_SYSTEM.md` — brand DNA, color usage rules, tone of voice, geometry
- `uploads/design-tokens.css` — the canonical token layer (also copied to project root as `design-tokens.css`)

No codebase or Figma file was attached. The system below is derived directly from those two documents and the Sparkassen-Finanzgruppe public brand context (Otl Aicher 1972, LIGALUX 2022).

## Products

The City Wallet has **two distinct surfaces**:

| Surface | Audience | Hero job |
|---|---|---|
| **Consumer wallet** | Sparkasse customer, mobile (≤420 px) | Surface one perfect, contextual offer + redeem in two taps |
| **Merchant console** | Local merchant, desktop/tablet | Set context rules ("if rain + lunch → −15%") and watch performance |

See `ui_kits/consumer/` and `ui_kits/merchant/`.

## Index

- `README.md` — you are here
- `DESIGN_SYSTEM.md` — brand DNA + rules (verbatim from upload)
- `design-tokens.css` — canonical CSS custom properties
- `colors_and_type.css` — semantic color aliases + typographic roles
- `SKILL.md` — agent skill manifest (works in Claude Code)
- `assets/` — logos, icons, brand glyphs
- `preview/` — Design System tab specimen cards
- `ui_kits/consumer/` — mobile wallet UI kit
- `ui_kits/merchant/` — merchant console UI kit

---

## Content fundamentals

> The voice is **calm with controlled warmth** — not cold, not gushing.

DSV is bank-adjacent. Copy is observational, not exhortational: it states the relevant fact and the offer, then stops.

### Rules

- **German is primary, English is secondary.** Default sample copy must be German.
- **No emoji in UI.** Weather glyphs, lock icons and similar are SVG. (Emoji are tolerated only in editorial places like push-notification copy fallbacks — and even then sparingly.)
- **No exclamation marks.** "Limited time!!!" is a forbidden register.
- **Sentence case** for headlines and buttons. ("Einlösen", not "EINLÖSEN".) The only thing that may be uppercase is the **trigger pill** (`ES REGNET · 11°C`) — and only because it's typographically letterspaced as a label.
- **Address the user with "Sie".** This is a Sparkasse product; "Du" is for sub-brands like S-Kreditpartner playful campaigns, not the wallet itself.
- **Numbers are tabular.** Always. Prices, distances, countdowns — `font-feature-settings: "tnum"`.
- **Distances in meters under 1 km.** "80 m", "350 m", then "1,2 km" (German decimal comma).
- **Times in 24-hour clock with German formatting.** "13:00", "noch 24 Min."
- **Currency: 4,90 €** — comma as decimal separator, space before €, € after the number.

### Tone calibration (from `DESIGN_SYSTEM.md` §4)

| | Example |
|---|---|
| ❌ Too emotional | *"Cold outside? Your cappuccino is waiting 🥺"* |
| ❌ Too cold | *"15% off Café Müller, 300m"* |
| ✅ Right (DE) | *"Es regnet. Heißer Kaffee, 80 m. — Café Lotte, −15% bis 13:00"* |
| ✅ Right (EN) | *"Raining. Hot coffee, 80 m away. — Café Lotte, −15% until 13:00"* |

### Sample copy library

- Trigger: `ES REGNET · 11 °C` · `MITTAGSPAUSE · 12:32` · `IN DER NÄHE · 80 M`
- Headline: `−15 %`, `2 für 1`, `Heißer Kaffee`
- Body: *"Cappuccino bei Café Lotte. Bis 13:00 Uhr."*
- CTA: `Einlösen` (primary) · `Später` (secondary, ghost) · `Zur Karte` (tertiary)
- Confirmation: `Eingelöst um 12:47 — 0,80 € Cashback`
- GDPR microcopy: `Verarbeitung erfolgt auf Ihrem Gerät.`

---

## Visual foundations

### Color

- Anchored on **Sparkassen-Rot HKS 13** (`#FF0000`). It is a **legally protected color trademark** and the single most valuable design asset. Treat it as ink, not paint.
- **Rule of thumb**: ≤ 1 red CTA + ≤ 1 red data point per offer card. Red competing with red collapses the hierarchy.
- Neutrals are warm-leaning, not cool: `#1A1A1A` ink on `#FFFFFF` surface, with `#F5F5F5` muted insets.
- **No blue as a primary.** `#0052CC` exists as `--info` for system messaging only. Blue is Payone's reserved space.
- **Semantic colors** are minimal: `--success` (`#00875A`) for "Eingelöst"; `--warning` (`#FF8A3D`) **only** for expiry countdowns. No other accents.

### Type

- **Inter**, regular / medium / semibold / bold. Closest free analogue to the Otl Aicher / Rotis heritage. *(See substitution flag below.)*
- Tabular numerals (`tnum`, `lnum`) on every numeric run.
- Mobile-first scale. The **3-second comprehension rule** is enforced by the offer-widget hierarchy in §3 of `DESIGN_SYSTEM.md`.
- Tight tracking on display sizes (`-0.015em` to `-0.02em`); positive tracking only on the trigger pill (`+0.06em`).
- Headlines and buttons are **sentence case**. The trigger pill is the lone exception (uppercase, letterspaced).

### Spacing & geometry

- **8-point grid** (`--space-1` 4px → `--space-9` 96px).
- **Cards**: `--radius-lg` (16 px). Friendly, not childish.
- **Buttons**: pick *one* — pill (`--radius-xl` 24 px) **or** rectangle (`--radius-md` 12 px) — and stick with it across the app. The City Wallet uses pill primary, rectangle secondary.
- **Container**: 420 px max width on mobile. The product is designed for one-thumb use.

### Backgrounds & surfaces

- **No gradients.** Anywhere. The only pseudo-gradient permitted is a 4 px solid red strip on the top of an offer widget.
- **No glassmorphism, no blur.** A modal sheet uses a flat `rgba(10, 10, 10, 0.5)` scrim — `--surface-overlay` — never `backdrop-filter: blur`.
- **No background images on consumer screens.** Optional: a single full-bleed photograph on a section header in the merchant marketing console (warm, documentary, never AI stock).
- **No repeating patterns or textures.**

### Cards

- White surface, 16 px radius, `--shadow-md` resting (`0 4px 12px rgba(0,0,0,0.08)`).
- Borders are optional and `--border-subtle` (`#EAEAEA`) when present — never both shadow and 1 px border at full strength.
- Offer widgets get a 4 px `--brand-red` top strip *or* a 6 px red dot (live indicator). Pick one per layout.

### Shadows & elevation

- Three steps: `--shadow-sm` (chips, badges), `--shadow-md` (cards at rest), `--shadow-lg` (modals, sheets).
- One special: `--shadow-red-glow` — `0 8px 24px rgba(255,0,0,0.18)`, only on the **press state of a redeem button**. Nowhere else.
- No inner shadows. No layered multi-step shadows.

### Borders & strokes

- 1 px hairline strokes, never 2 px, except on iconography (which is 2 px stroke as a constant).
- Dividers are `--stroke-1` (`#EAEAEA`), inputs are `--stroke-2` (`#D4D4D4`) at rest, `--accent-deep` on focus.

### Motion

- **Easing**: `--ease-standard` `cubic-bezier(0.4, 0, 0.2, 1)` for 95% of transitions; `--ease-emphasized` for the redeem confirmation only.
- **Durations**: 150 ms (state change), 250 ms (transition), 400 ms (route).
- **No bounce, no overshoot.** This is German functionalism, not Material 3 expressive.
- Confirmation animation: a single 250 ms scale 0.98 → 1.0 + checkmark draw. Done.

### Hover & press states

- **Hover** (desktop only): background `--brand-red` → `--brand-red-deep` for primary CTA. Neutral buttons darken `--bg-2` → `--bg-3`. No scale-on-hover.
- **Press**: `transform: scale(0.98)` on tappable surfaces, 150 ms. The redeem button additionally gains `--shadow-red-glow`.
- **Focus**: 3 px red-tinted ring (`rgba(255,0,0,0.25)`), no outline.
- **Disabled**: 40% opacity, no pointer events. No grey-on-grey.

### Transparency & blur

- Used only for the modal scrim (50% black). Never on text, never on cards.

### Imagery (if used)

- Documentary, warm, real (not stock). Slight warm white balance, no heavy color grading.
- Black-and-white is acceptable for editorial; never for offer photography.
- Forbidden: AI-generated "happy diverse customers", glossy product renders, cartoon illustration.

### Layout rules

- **Fixed elements**: top header (56 px), bottom nav (64 px). Both flat, both `--surface` with a 1 px `--stroke-1` divider — no shadow.
- Content scrolls between them. The single offer widget is the focal point, padded `--space-5` (24 px) from the container edges.
- Cards never butt against the screen edge — minimum 16 px gutter.

### Iconography (summary; full section below)

- **Lucide** (CDN), 2 px stroke, square corners, geometric primitives. Default 20 px, large 24 px, small 16 px.
- Icon color = current text color. Red icons reserved for the brand mark and the red-strip live indicator.
- No emoji in UI. No filled icons (outline only) except `lucide:lock-keyhole` for GDPR microcopy and the redeem-confirmation check.

---

## Iconography

The City Wallet uses **[Lucide](https://lucide.dev/)** (MIT) loaded from CDN. Lucide's 2 px stroke / square-corner / geometric-primitive grammar is a direct match for the Otl Aicher visual lineage and cannot be confused with the rounded-corner Material or Phosphor styles that read as "consumer app".

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

A core subset is also vendored as inline SVG in `assets/icons/` for offline use and so the pixel-perfect specimens in `preview/` don't depend on the CDN.

### Approved icon vocabulary (consumer)

| Use | Icon |
|---|---|
| Live offer dot | `assets/icons/dot-red.svg` (custom — solid red 6 px circle) |
| Weather: rain | `lucide:cloud-rain` |
| Weather: sun | `lucide:sun` |
| Weather: snow | `lucide:cloud-snow` |
| Time / countdown | `lucide:clock` |
| Location | `lucide:map-pin` |
| Wallet / payment | `lucide:wallet` |
| Cashback | `lucide:circle-dollar-sign` |
| Privacy / on-device | `lucide:lock-keyhole` |
| Confirmation | `lucide:check` (drawn, not filled) |
| Navigation: home | `lucide:layout-grid` |
| Navigation: offers | `lucide:tag` |
| Navigation: history | `lucide:receipt` |
| Navigation: profile | `lucide:user-round` |

### Logos

`assets/sparkassen-s.svg` is a clean recreation of the **Sparkassen-S** mark — the geometric S-form first drawn in 1938 and refined by Otl Aicher in 1972. Used as the brand mark in the wallet header and the splash. **Always on `--brand-red` ground or in `--brand-red` on white.** Never tinted, never on a photograph, never inside another shape.

### Substitutions flagged

- **Inter** is used in place of the Sparkassen-Finanzgruppe corporate types (FF Mark, Rotis-derived faces) because no licensed font files were provided. → *If you have access to the licensed corporate font, please drop the `.woff2` files into `fonts/` and update `colors_and_type.css`.*
- **Sparkassen-S logo**: a clean reconstruction of the public mark for prototyping only. → *For production, please supply the official logo SVG with the legally protected red.*

---

## Caveats & known gaps

- No codebase or Figma file was attached. UI kits are derived from the brand DNA in `DESIGN_SYSTEM.md` rather than from existing production code.
- Dark mode is tokenized but not yet specimen-tested; the consumer kit is light-mode only in this revision.
- Merchant console is laid out at desktop width (1280 px) without a tablet breakpoint.
- Real merchant logos are placeholders.
