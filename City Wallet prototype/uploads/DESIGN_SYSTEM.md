# DSV-Gruppe / City Wallet — Design System

> Brand: Sparkassen-Finanzgruppe (DSV-Gruppe)
> Product: City Wallet — generative, context-aware local offers
> Heritage: Otl Aicher (1972) → LIGALUX redesign (2022, iF Award)

---

## 1. Brand DNA — non-negotiable

**Sparkassen-Rot HKS 13 (`#FF0000`)** is a legally protected color trademark in Germany. 97% of Germans recognize Sparkasse; over half can name the red. This single color carries more brand equity than any logo. **Use it deliberately, not decoratively.**

The brand's design lineage runs through Otl Aicher → Bauhaus → Swiss International Style → German functionalism. This means:

- ✅ Geometric, grid-driven, calm, rational
- ✅ Clear hierarchy, generous whitespace, tabular numbers
- ❌ No glassmorphism, no gradients, no skeuomorphism
- ❌ No playful illustration, no rounded mascots, no emoji-heavy UI

The 2022 redesign (LIGALUX) describes the system as: **"modular, simple principles of color, shapes and canvasses, bold and forward-looking."**

---

## 2. Color usage rules

| Token | When to use | When NOT |
|---|---|---|
| `--brand-red` | Primary CTA, redeem button, brand mark, key data point | Backgrounds (>20% of screen), body text, decorative fills |
| `--brand-red-deep` | Hover/active state, red on light tinted surfaces | Default state |
| `--brand-red-soft` | Subtle badge backgrounds, tinted highlights | Anywhere needing emphasis |
| `--success` | Cashback received, "Eingelöst" confirmation | Generic positive feedback |
| `--warning` | **Expiry countdown only** (e.g. "noch 3 Min.") | Anything else — do not use as accent |

**Color rule of thumb**: a single offer card should have ≤1 red CTA, ≤1 red data point. Red competing with red kills the hierarchy.

⚠️ **Do not introduce blue as a primary color.** Blue belongs to Payone (sub-brand). Mixing dilutes Sparkassen-Rot recognition.

---

## 3. Typography

**Font**: Inter (closest free analogue to the Otl Aicher / Rotis heritage). Use `font-feature-settings: "tnum" 1, "lnum" 1;` for all prices, distances, countdowns.

**Voice scale** for an offer widget (top to bottom):

1. **Trigger reason** — `--text-sm`, `--brand-red`, uppercase tracking — *"Es regnet · 11°C"*
2. **Headline / hero number** — `--text-3xl`, bold — *"−20%"*
3. **Offer subject** — `--text-xl`, semibold — *"Cappuccino"*
4. **Place + distance** — `--text-base`, regular — *"Café Lotte · 80 m"*
5. **Countdown** — `--text-sm`, medium, `--warning` — *"noch 24 Min."*
6. **CTA button** — `--text-base`, semibold, white-on-red

This hierarchy is what makes the **3-second comprehension** rule work. Don't break it.

---

## 4. Tone of voice

DSV is a bank-adjacent organization. The voice is **calm with controlled warmth** — not cold, not gushing.

- ❌ Too emotional: *"Cold outside? Your cappuccino is waiting 🥺"*
- ❌ Too cold: *"15% off Café Müller, 300m"*
- ✅ Right tone (DE): *"Es regnet. Heißer Kaffee, 80 m. — Café Lotte, −15% bis 13:00"*
- ✅ Right tone (EN): *"Raining. Hot coffee, 80 m away. — Café Lotte, −15% until 13:00"*

**Bilingual default**: German primary, English secondary. The product is rooted in German savings-bank infrastructure.

---

## 5. Geometry & shape language

The Sparkassen-S logo (1938) is built from a **geometric S-form**. The 2022 system extracts that shape principle as the visual seed for the entire brand portfolio.

For City Wallet, this translates to:

- **Cards**: `--radius-lg` (16px) — friendly but not childish
- **Buttons**: `--radius-xl` (24px) pill or `--radius-md` (12px) rectangle. Pick one and stick with it across the app.
- **Iconography**: 2px stroke, square corners, geometric primitives (Lucide icons fit well)
- **Avoid**: hand-drawn illustrations, blob shapes, organic curves, decorative gradients

---

## 6. Component patterns (City Wallet specifics)

### Offer Widget (the hero component)
- Width: full bleed within `--container-max`
- Padding: `--space-5` (24px)
- Background: `--surface`
- Top border accent: 4px `--brand-red` strip OR a small red dot indicating "live offer"
- Shadow: `--shadow-md` resting, `--shadow-red-glow` on press

### Trigger Pill (above offer headline)
- Pill background: `--brand-red-soft`
- Text: `--brand-red-deep`, `--text-xs`, uppercase, `letter-spacing: 0.05em`
- Format: `[icon] CONTEXT REASON · METRIC` — e.g. *"☔ ES REGNET · 11°C"*

### Redeem Button
- Background: `--brand-red`
- Text: `--text-on-red`, semibold
- Radius: `--radius-xl`
- Height: 48px minimum (thumb-friendly)
- On press: scale 0.98, background → `--brand-red-deep`

### Merchant Dashboard Card
- More restrained than the consumer card — `--surface-muted` background
- Use `--text-secondary` for labels, `--ink` for numbers
- Charts: monochrome with single `--brand-red` accent for the focal metric

---

## 7. Privacy/GDPR visual language

Where the product surfaces "on-device inference" or "your data stays local," use:

- A small lock icon + microcopy in `--text-tertiary`, `--text-xs`
- Never a marketing banner — German users distrust hype around privacy. Understate it.

---

## 8. Forbidden patterns

- ❌ Skeuomorphic coupon-card visuals (paper rips, dotted scissors lines)
- ❌ Notification spam aesthetics (multiple red badges, pulsing icons)
- ❌ E-commerce "limited time!!!" red-banner-everywhere chaos
- ❌ AI-generated stock illustration of "happy diverse customers"
- ❌ Gradient-heavy dashboards with floating cards on blurred photos

The brand is the **opposite of cluttered loyalty-app aesthetics**. Restraint is the differentiator.

---

## 9. Reference inspiration

When in doubt, pull visual direction from:
- Lufthansa (Otl Aicher heritage, same DNA)
- Braun (Dieter Rams' "less but better")
- N26 / Trade Republic (modern German fintech minimalism)
- The Sparkasse mobile banking app itself

Avoid pulling from: Lidl Plus, PayBack, Groupon, Shopify storefronts.
