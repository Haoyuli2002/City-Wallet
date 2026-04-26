# City Wallet — Consumer App

Mobile-first consumer wallet, built to the high-fidelity prototypes in
`../City Wallet prototype/` (`U-4 Offer Card.html` + `phase2/Phase 2 Consumer
Flow.html`). Sparkasse design language: red HKS 13 as ink, Inter type,
tabular numerals, German "Du" copy, no gradients, no emoji in UI.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Plain CSS using `design-tokens.css` (ported from the prototype) — no Tailwind
- `next/font` for Inter + JetBrains Mono
- Mock API layer in `src/lib/api.ts` matching `../API_DOCS.md`

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build
```

## Screens

| Route          | Spec | What it shows |
| -------------- | ---- | --- |
| `/`            | U-3  | Greeting + ContextState 2×2 + Live-Angebot compact card |
| `/offer/[id]`  | U-4  | GenUI hero card, KI-Erklärung bottom sheet, Einlösen CTA |
| `/redeem/[id]` | U-6  | Full-screen dark QR + countdown + "Eingelöst" confirmation |
| `/wallet`      | U-5  | Dark balance card (cashback) + transaction history |
| `/settings`    |      | Profile + privacy toggles |

The demo flow (`/` → `/offer/offer_cappuccino_lunch` → `/redeem/...` →
"Eingelöst markieren" → `/wallet`) writes to an in-memory store so the
cashback amount appears in the wallet's transaction list.

## Hooking up the real backend

`src/lib/api.ts` is a single-file mock. To swap to the FastAPI backend, replace
each function with a `fetch()` call against `process.env.NEXT_PUBLIC_API_BASE`
(defaults to `http://localhost:8000`); the response shapes already mirror
`API_DOCS.md`.
