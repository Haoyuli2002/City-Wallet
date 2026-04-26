---
name: city-wallet-design
description: Use this skill to generate well-branded interfaces and assets for the Sparkasse City Wallet (DSV-Gruppe), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Brand DNA is Otl Aicher / German functionalist; Sparkassen-Rot HKS 13 (#FF0000) is a legally protected trademark — treat it as the most precious resource.
user-invocable: true
---

Read `README.md` first, then `DESIGN_SYSTEM.md` for the non-negotiable brand rules. The canonical token layer is `design-tokens.css`; semantic typography roles live in `colors_and_type.css`.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out of `assets/` and create static HTML files for the user to view. The `ui_kits/consumer/` and `ui_kits/merchant/` folders contain ready-to-copy React components.

Hard rules (read these before designing anything):
- Sparkassen-Rot is ink, not paint. ≤ 1 red CTA + ≤ 1 red data point per offer card.
- No blue as a primary — blue belongs to Payone.
- No glassmorphism, no gradients, no skeuomorphism, no emoji-heavy UI.
- Mobile-first at 380 px. German copy primary, English secondary.
- Tabular numerals on all numbers.
- GDPR is understated — small lock icon, tertiary text. Never a marketing banner.

If the user invokes this skill without other guidance, ask what they want to build, ask clarifying questions (audience, surface, fidelity), and act as an expert designer outputting HTML artifacts or production code as needed.
