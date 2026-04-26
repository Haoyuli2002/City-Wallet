# Consumer UI kit — City Wallet (mobile)

The wallet as it appears in a Sparkasse customer's hand. 380 px design width.

## Screens (interactive in `index.html`)

1. **Heute** — the home screen, single offer widget (the 3-second comprehension hero).
2. **Redemption sheet** — slide-up sheet with the QR/PIN payload + countdown.
3. **Eingelöst** — confirmation state (cashback amount, time, transaction ID).
4. **Verlauf** — past redemptions, list view.
5. **Profil** — privacy-first settings (on-device inference toggle, location, notifications).

## Components

- `Header.jsx`, `BottomNav.jsx` — app chrome
- `TriggerPill.jsx` — context-reason chip
- `OfferWidget.jsx` — hero card (red strip, headline, CTA)
- `RedeemSheet.jsx` — slide-up redemption modal
- `ReceiptRow.jsx` — verlauf list item
- `Toggle.jsx`, `SettingRow.jsx` — profile screen primitives
- `Phone.jsx` — light iOS-ish frame for the index

## Conventions

- All copy German first.
- Tabular numerals on every number.
- Red used **once** per visible screen (the redeem CTA).
- No shadows on chrome, only on cards.
