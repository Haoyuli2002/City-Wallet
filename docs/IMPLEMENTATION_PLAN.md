# 🛠️ CITY WALLET — Implementation Plan

> Chinese version: [IMPLEMENTATION_PLAN_CN.md](./IMPLEMENTATION_PLAN_CN.md)

## Overview

| Item | Details |
|------|---------|
| Project | City Wallet — Generative City Wallet |
| Challenge | DSV-Gruppe MIT Hackathon Challenge 01 |
| Stack | Python FastAPI + Next.js 14 + OpenAI GPT-4o |
| Cities | Munich (primary), Stuttgart (secondary) |

---

## Architecture

```
Consumer Device (Privacy Layer)
    ↓ abstract intent only: { intent: "browsing_food", zone: "marienplatz" }
Python FastAPI Backend (localhost:8000)
    ├── Context Sensing Layer   (weather + time + places + tx density + intent)
    ├── Generative Offer Engine (GPT-4o → full offer JSON)
    └── Checkout & Redemption  (QR token → validate → cashback)
        ↓
Frontend (Next.js 14)
    ├── Consumer App (localhost:3000)
    └── Merchant Dashboard (localhost:3001)
```

---

## Three Core Modules

### Module 1 — Context Sensing Layer

Aggregates 5 real-time signals:

| Signal | Source | Data |
|--------|--------|------|
| Weather | OpenWeatherMap API | temp, feels_like, condition, humidity, wind |
| Time | Python datetime | weekday/weekend, time slot, season |
| User Intent | On-device JS | browsing / commuting / stationary |
| Nearby Merchants | Google Places API | name, rating, distance, photo |
| Transaction Density | Simulated Payone | tx count vs hourly average |

**Output**: Composite trigger score (0–1). Threshold: **> 0.7 → generate offer**.

---

### Module 2 — Generative Offer Engine

**Input**: Context state + merchant rules  
**Model**: OpenAI GPT-4o  
**Output**: Complete offer JSON

```json
{
    "headline": "Cold outside? ☕",
    "subtext": "Your cappuccino is waiting at Café Scholz, just 80m away",
    "discount_percent": 15,
    "cta_text": "Warm Up Now",
    "mood": "cozy",
    "color_primary": "#8B4513",
    "color_background": "#FFF8DC",
    "icon": "☕",
    "valid_minutes": 15
}
```

All fields — tone, discount, visual theme — are determined by the AI. **No templates.**

---

### Module 3 — Checkout & Redemption

```
User accepts offer
    → Unique QR token generated (CW-YYYY-xxxxxxxx)
    → User walks to merchant, shows QR
    → Merchant scans → backend validates
    → Discount applied, cashback credited
    → Both dashboards update in real time
```

---

## Database Schema (SQLite)

| Table | Purpose |
|-------|---------|
| `merchants` | Business info (name, location, category, rating) |
| `merchant_rules` | AI constraints (max discount, target, tone, budget) |
| `offers` | Generated offers with full AI content + status |
| `redemptions` | QR token, transaction amount, discount applied |
| `wallet` | User cashback balance |
| `wallet_transactions` | Cashback history |
| `simulated_transactions` | Payone transaction simulation |

---

## API Endpoints (16 total)

| Category | Endpoints |
|----------|-----------|
| Context | POST /api/context |
| Offers | generate, get, accept, dismiss, redeem |
| Wallet | GET /api/wallet/{user_id} |
| Merchants | list, get, rules, analytics, feed |
| Users | preferences (get/set) |
| Utility | geocode, health |

Full documentation: [API_DOCS.md](./API_DOCS.md)

---

## Privacy Architecture (GDPR)

| Data | Processing | Sent to Server? |
|------|-----------|-----------------|
| GPS coordinates | On-device only | ❌ Never |
| Movement trajectory | On-device only | ❌ Never |
| User preferences | localStorage | ❌ Never |
| Intent signal | Derived on-device | ✅ Abstract only |
| Offer interactions | Server | ✅ Anonymized ID |

---

## Development Milestones

| Phase | Task | Priority |
|-------|------|----------|
| 1 | Project setup (FastAPI + Next.js + SQLite) | 🔴 Critical |
| 2 | Database schema + seed data (Munich) | 🔴 Critical |
| 3 | Google Places API integration | 🔴 Critical |
| 4 | Context Sensing Layer | 🔴 Critical |
| 5 | Behavior Intent Engine (frontend) | 🟡 Important |
| 6 | Context Aggregation Engine | 🔴 Critical |
| 7 | Generative Offer Engine (GPT-4o) | 🔴 Critical |
| 8 | Redemption APIs (QR generation + validation) | 🔴 Critical |
| 9 | Consumer UI — Home + Context + Offer Cards | 🔴 Critical |
| 10 | Consumer UI — QR Checkout + Wallet | 🔴 Critical |
| 11 | Merchant Dashboard + Live Feed | 🔴 Critical |
| 12 | Merchant Rules Configuration | 🟡 Important |
| 13 | Merchant Analytics (funnel + charts) | 🟡 Important |
| 14 | Merchant QR Scanner | 🟡 Important |
| 15 | End-to-end demo scenario (Mia's story) | 🔴 Critical |
| 16 | GDPR compliance documentation | 🟢 Nice to have |
| 17 | English documentation + README | 🟢 Nice to have |

---

## Demo Scenario

**Two browser windows side by side:**

**Left — Consumer (Mia's phone)**:
1. App opens → Munich city center context
2. Context bar: "☁️ 12°C · Tuesday 12:15"
3. Behavior engine: "🚶 Browsing · 2 stops"
4. AI offer card slides in
5. Mia taps "Warm Up Now"
6. QR code + countdown timer
7. Simulated redemption → cashback credited

**Right — Merchant (Café Scholz dashboard)**:
1. Dashboard shows today's metrics
2. Live feed: "🤖 Offer Generated"
3. Live feed: "✅ Offer Accepted"
4. Live feed: "📱 QR Redeemed · €4.50"
5. Funnel chart updates
6. Rules panel for quick adjustments

---

## City Configuration

Switching cities requires only a config file change:

```json
// backend/config/cities/munich.json
{
    "city_id": "munich",
    "name": "Munich",
    "center_lat": 48.1371,
    "center_lon": 11.5754,
    "search_radius_m": 500
}
```

No code changes needed to deploy to a new city.
