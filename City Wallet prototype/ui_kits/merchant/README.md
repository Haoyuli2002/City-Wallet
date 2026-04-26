# Merchant UI kit — City Wallet console

The merchant-facing console. Where a local Café Lotte owner sets the rules ("when it rains during lunch, offer −15% on hot drinks") and watches performance.

Design width: 1280 px (desktop). Restrained, dashboard-grade — `--surface-muted` background, monochrome charts with a single brand-red accent.

## Screens (in `index.html`, switch via top tabs)

1. **Übersicht** — performance dashboard with KPIs, conversion chart, recent redemptions
2. **Regeln** — context-rule list ("if rain + lunch → −15% on hot drinks")
3. **Rule editor** — modal for creating/editing a rule
4. **Abrechnung** — settlements / payout table

## Components

- `Sidebar.jsx` — vertical nav with Sparkasse mark + merchant identity
- `Topbar.jsx` — page title + quick actions
- `KpiCard.jsx`, `MiniSpark.jsx` — restrained metric tiles + monochrome bar chart
- `RuleRow.jsx` — list item for a rule with on/off toggle and live status
- `RuleEditor.jsx` — modal with trigger picker, offer fields, preview
- `Table.jsx` — settlements table with tabular numerals
