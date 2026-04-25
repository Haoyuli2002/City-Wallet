# 🏙️ CITY WALLET — Product Specification

## Generative City-Wallet: Hyperpersonalized Offers for Anyone, Anywhere

**Powered by DSV-Gruppe · MIT Hackathon Challenge 01**

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [System Architecture](#2-system-architecture)
3. [Consumer Side — User Flow](#3-consumer-side)
4. [Merchant Side — User Flow](#4-merchant-side)
5. [Three Core Modules](#5-three-core-modules)
6. [Tech Stack](#6-tech-stack)
7. [API Design](#7-api-design)
8. [Database Schema](#8-database-schema)
9. [GenUI Design Specification](#9-genui-design-specification)
10. [UX Requirements](#10-ux-requirements)
11. [GDPR Compliance](#11-gdpr-compliance)
12. [Development Milestones](#12-development-milestones)

---

## 1. Product Vision

### The Problem
Mia is 28, works in marketing, and is walking through Stuttgart's old town on a Tuesday lunch break — twelve minutes to spare, slightly cold, vaguely hungry, phone in hand. A café 80m away has been quiet all morning. But no system connects these two facts.

### The Solution
**City Wallet** is an AI-powered city wallet that detects the most relevant local offer for a user in real time, generates it dynamically, and makes it redeemable through a seamless checkout.

### Key Differentiators
- **Offers don't exist until the moment they are needed** — generated specifically for this user, this location, this minute
- **Merchant sets rules; AI creates the offer** — no marketing expertise required
- **On-device behavior analysis** — GDPR-compliant, only abstract intent signals leave the device
- **Real data, not mock data** — Google Places for real merchants, OpenWeatherMap for real weather

---

## 2. System Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                      CITY WALLET ARCHITECTURE                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌── USER DEVICE (Privacy Layer) ─────────────────────────────┐ ║
║  │                                                             │ ║
║  │  📍 GPS Sensor → 🚶 Trajectory Buffer → 🧠 Behavior        │ ║
║  │                   (every 10s)           Analysis            │ ║
║  │                                          (on-device)        │ ║
║  │                                              │              │ ║
║  │                            Only abstract intent signal:     │ ║
║  │                     { intent: "browsing_food", zone: "..." }│ ║
║  └──────────────────────────────┬──────────────────────────────┘ ║
║                                  │                                ║
║                                  ▼                                ║
║  ┌── PYTHON FASTAPI BACKEND ──────────────────────────────────┐ ║
║  │                                                             │ ║
║  │  ┌─ MODULE 1: Context Sensing Layer ─────────────────────┐ │ ║
║  │  │                                                        │ │ ║
║  │  │  🌤️ Weather        🕐 Time          📊 Payone Tx      │ │ ║
║  │  │  (OpenWeatherMap)  (weekday/slot)   (simulated)       │ │ ║
║  │  │                                                        │ │ ║
║  │  │  🏪 Nearby POI     🎭 Events        🚶 User Intent    │ │ ║
║  │  │  (Google Places)   (calendar)       (from device)     │ │ ║
║  │  │                                                        │ │ ║
║  │  │          ┌──────────────────────────────┐              │ │ ║
║  │  │          │  Context Aggregation Engine   │              │ │ ║
║  │  │          │  → Composite Context State    │              │ │ ║
║  │  │          └──────────────┬───────────────┘              │ │ ║
║  │  └─────────────────────────┼──────────────────────────────┘ │ ║
║  │                             │                                │ ║
║  │  ┌─ MODULE 2: Generative Offer Engine ───────────────────┐ │ ║
║  │  │                                                        │ │ ║
║  │  │  Context State + Merchant Rules → OpenAI GPT-4o        │ │ ║
║  │  │          │                                              │ │ ║
║  │  │          ▼                                              │ │ ║
║  │  │  Dynamic Offer JSON:                                   │ │ ║
║  │  │  • headline, subtext (emotional copy)                  │ │ ║
║  │  │  • discount_percent (within merchant max)              │ │ ║
║  │  │  • visual theme, colors, icon                          │ │ ║
║  │  │  • CTA text, urgency timing                            │ │ ║
║  │  └────────────────────────┬───────────────────────────────┘ │ ║
║  │                            │                                 │ ║
║  │  ┌─ MODULE 3: Checkout & Redemption ─────────────────────┐ │ ║
║  │  │                                                        │ │ ║
║  │  │  Accept → QR Code → Merchant Scan → Validate           │ │ ║
║  │  │       → Cashback to Wallet → Record Transaction        │ │ ║
║  │  └────────────────────────────────────────────────────────┘ │ ║
║  │                                                             │ ║
║  │  ┌─ DATABASE (SQLite) ────────────────────────────────────┐ │ ║
║  │  │  merchants │ rules │ offers │ redemptions │ wallet      │ │ ║
║  │  │  transactions │ user_profiles │ analytics               │ │ ║
║  │  └────────────────────────────────────────────────────────┘ │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                  │                                ║
║                                  ▼                                ║
║  ┌── FRONTEND (Next.js 14) ───────────────────────────────────┐ ║
║  │                                                             │ ║
║  │  ┌─ Consumer App ──────┐  ┌─ Merchant Dashboard ────────┐ │ ║
║  │  │ 🗺️ Map + Trajectory  │  │ 📊 Performance Overview     │ │ ║
║  │  │ 🔔 Context Bar      │  │ 📋 Rule Configuration       │ │ ║
║  │  │ 🎨 GenUI Offer Cards│  │ 🔔 Live Feed (alerts)       │ │ ║
║  │  │ 📱 QR Checkout      │  │ 📈 Analytics + Funnel       │ │ ║
║  │  │ 💰 Wallet + History │  │ 📱 QR Scanner               │ │ ║
║  │  │ ⚙️ Privacy Settings │  │ 👤 Consumer Profiles        │ │ ║
║  │  └─────────────────────┘  └──────────────────────────────┘ │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 3. Consumer Side

### Complete User Journey (Mia's Story)

#### Step 1: Environment Sensing (On-Device)
```
Mia opens City Wallet app
    │
    ├── 📍 GPS starts tracking (every 10 seconds)
    ├── 🚶 Trajectory buffer collects location points
    ├── 🧠 On-device behavior analysis:
    │   ├── Average speed: 1.8 km/h (slow → browsing)
    │   ├── Stops in last 10 min: 2 (window shopping)
    │   ├── Direction variance: high (zigzag, not commuting)
    │   └── Time context: Tuesday 12:15, lunch break
    │
    └── 🎯 Intent inference: "browsing_food" (confidence: 0.85)
        Only this abstract signal is sent to backend
```

#### Step 2: Backend Context Aggregation
```
Backend receives: { intent: "browsing_food", zone: "altstadt" }
    │
    ├── 🌤️ OpenWeatherMap: 11°C, overcast, feels like 8°C
    ├── 🕐 Time engine: Tuesday, 12:15, lunch_break slot
    ├── 📊 Payone simulator: Café nearby has only 3 tx today (very low)
    ├── 🏪 Google Places: Real cafés within 500m with ratings & photos
    └── 🎭 Events: No special events today
    
    ▼
    Context State:
    {
        trigger: "warm_drink_opportunity",
        score: 0.92,
        best_match: "Café Scholz (4.5★, 80m, very quiet today)",
        signals: ["cold_weather", "browsing_food", "quiet_cafe", "lunch_break"]
    }
```

#### Step 3: AI Offer Generation
```
Context + Merchant Rules → OpenAI GPT-4o
    │
    ▼
    {
        headline: "Cold outside? ☕",
        subtext: "Your cappuccino is waiting at Café Scholz, just 80m away",
        discount_percent: 15,
        cta: "Warm Up Now",
        mood: "cozy",
        colors: { primary: "#8B4513", background: "#FFF8DC", accent: "#D2691E" },
        icon: "☕",
        valid_minutes: 15,
        reasoning: "Cold overcast + browsing + quiet café → warm drink, cozy tone"
    }
```

#### Step 4: GenUI Offer Display
```
┌─────────────────────────────────┐
│  🌤️ 11°C Overcast · Tue 12:15   │  ← Context bar
│  🚶 Browsing · 80m from café     │  ← Behavior intent
│                                   │
│  ┌───────────────────────────┐   │
│  │                            │   │
│  │  ☕                         │   │  ← Large icon (3-sec comprehension)
│  │                            │   │
│  │  Cold outside?             │   │  ← Emotional headline (AI)
│  │  Your cappuccino           │   │
│  │  is waiting.               │   │  ← Situational subtext (AI)
│  │                            │   │
│  │  Café Scholz · ★4.5 · 80m │   │  ← Real merchant data (Google)
│  │  15% off · ⏱️ 14:52 left   │   │  ← Discount + countdown
│  │                            │   │
│  │  [  ☕ Warm Up Now  ]      │   │  ← AI-generated CTA
│  │                            │   │
│  └───────────────────────────┘   │
│  (warm color scheme by AI)        │  ← AI decides visual theme
└─────────────────────────────────┘
```

#### Step 5: User Decision
```
Three possible outcomes:

✅ ACCEPT → Generates QR code + saves to wallet + starts countdown
❌ DISMISS → Swipe away, gentle fade, "Not your vibe? Got it."
⏰ EXPIRE → Soft fade-out, "This one's gone, but we'll find another"

All outcomes are recorded as feedback for the recommendation model.
```

#### Step 6: Checkout & Redemption (on Accept)
```
┌───────────────────────────┐
│  ✅ Offer Claimed!         │
│                            │
│     ┌──────────────┐      │
│     │  ██████████  │      │
│     │  ██ QR CODE██│      │  ← Dynamic QR code (unique token)
│     │  ██████████  │      │
│     └──────────────┘      │
│                            │
│  Show this at Café Scholz  │
│  ⏱️ Expires in 14:30       │  ← Countdown timer
│                            │
│  📍 Navigate (80m) →       │  ← Walking directions
└───────────────────────────┘

At the café:
├── Mia shows QR code
├── Merchant scans → Backend validates → ✅ Approved
├── Transaction: €4.50 cappuccino
├── Discount: 15% = €0.68 off
└── €0.68 cashback credited to Mia's City Wallet

Post-redemption:
├── Feedback data recorded (accepted + redeemed)
├── User preference model updated
└── Merchant dashboard updated in real-time
```

### Consumer App Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Home | `/` | Map + context bar + offer card feed |
| Offer Detail | `/offer/:id` | Full offer details + merchant info + photos |
| QR Checkout | `/checkout/:id` | QR code + countdown + navigation |
| Wallet | `/wallet` | Balance, transaction history, cashback |
| Settings | `/settings` | GDPR privacy controls, preferences |

---

## 4. Merchant Side

### Merchant Onboarding
```
Merchant opens merchant.citywallet.app
    │
    ├── 1. Register/Login
    ├── 2. Business info (auto-populated from Google Places)
    │       • Name, address, category, photos, rating
    ├── 3. Configure AI Rules:
    │   ├── Max discount: 5% / 10% / 15% / 20%
    │   ├── Target: "Fill quiet hours" / "Lunch rush" / "Rainy day special"
    │   ├── Product scope: All / Hot drinks / Pastries / Lunch menu
    │   ├── Brand tone: Cozy / Professional / Young & energetic
    │   ├── Daily budget cap: €20 / €50 / €100
    │   └── Active hours: Automatic (based on Payone data) / Custom
    └── 4. Connect Payone terminal (simulated)
```

### Merchant Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│  🏪 Café Scholz · Merchant Dashboard                             │
│                                                                   │
│  ┌─ Today's Performance ───────────────────────────────────────┐ │
│  │                                                              │ │
│  │  📤 Pushed: 24    👁️ Read: 18    ✅ Accepted: 7               │ │
│  │  📱 Redeemed: 5   ❌ Dismissed: 5   ⏰Expired: 8       │ │
│  │                                                              │ │
│  │  Acceptance Rate:  39%  ████████░░░░░░░░░░░                  │ │
│  │  Redemption Rate:  71%  ██████████████░░░░░░                 │ │
│  │  Conversion Rate:  28%  █████░░░░░░░░░░░░░░                  │ │
│  │                                                              │ │
│  │  Revenue from Offers: €22.50                                 │ │
│  │  Discount Given:      €3.38                                  │ │
│  │  Net Incremental:     €19.12  📈                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Live Feed (Real-time Alerts) ──────────────────────────────┐ │
│  │  12:20  📱 QR Redeemed · €4.50 · -€0.68 discount        ✅ │ │
│  │  12:17  ✅ Offer Accepted by user (female, 25-30)          │ │
│  │  12:15  🤖 Offer Generated: "Cold outside? ☕"              │ │
│  │  12:10  ❌ Offer Dismissed by user                          │ │
│  │  11:45  ⏰ Offer Expired (no response)                      │ │
│  │  11:30  🤖 Offer Generated: "Tuesday treat — 10% off"      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Consumer Profile Preview (on redemption) ──────────────────┐ │
│  │  👤 Anonymous Profile #2847                                  │ │
│  │  Age bracket: 25-30 · Likely intent: warm drink              │ │
│  │  Previous visits: 0 (new customer!)                          │ │
│  │  Offer responded to: "Cold outside? ☕" (15% off)            │ │
│  │  Note: This is anonymized data — no personal identifiers     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ AI Rules (Quick Edit) ─────────────────────────────────────┐ │
│  │  Max Discount:  [20%  ▼]                                    │ │
│  │  Target:        [Fill quiet hours  ▼]                       │ │
│  │  Products:      [☑ Hot drinks  ☑ Pastries  ☐ Lunch]        │ │
│  │  Brand Tone:    [Cozy  ▼]                                   │ │
│  │  Daily Budget:  [€50  ▼]   Spent today: €3.38              │ │
│  │                                                              │ │
│  │  [💾 Save Rules]  [⏸️ Pause Offers]                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Merchant Analytics Page
```
┌──────────────────────────────────────────────────────────────────┐
│  📈 Analytics · Café Scholz                                      │
│                                                                   │
│  Period: [Today ▼] [This Week] [This Month] [Custom]             │
│                                                                   │
│  ┌─ Offer Funnel ──────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  📤 Pushed        ████████████████████████  24  (100%)      │ │
│  │  👁️ Read          ██████████████████        18  (75%)       │ │
│  │  ✅ Accepted      ██████████                 7  (39%)       │ │
│  │  📱 Redeemed      ██████                     5  (28%)       │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Revenue Impact ────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Total Offer Revenue:    €22.50                              │ │
│  │  Total Discount Given:   €3.38                               │ │
│  │  Estimated Incremental:  €19.12                              │ │
│  │  Cost per Acquisition:   €0.68                               │ │
│  │  ROI:                    566%                                │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Offer History ─────────────────────────────────────────────┐ │
│  │  Time   Offer                    Status   Discount  Amount  │ │
│  │  12:20  "Cold outside? ☕"       Redeemed  15%      €4.50   │ │
│  │  12:15  "Warm up with cake"     Accepted  10%      —       │ │
│  │  12:10  "Tuesday treat"         Dismissed  —       —       │ │
│  │  11:45  "Morning pick-me-up"    Expired    —       —       │ │
│  │  ...                                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Merchant QR Scanner Page
```
┌──────────────────────────────────────────────────────────────────┐
│  📱 Scan Customer QR Code                                        │
│                                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │                                       │                        │
│  │          [ Camera Viewfinder ]        │                        │
│  │                                       │                        │
│  │       Point at customer's QR code     │                        │
│  │                                       │                        │
│  └──────────────────────────────────────┘                        │
│                                                                   │
│  ── After successful scan ──                                     │
│                                                                   │
│  ┌─ Offer Validation ─────────────────────────────────────────┐ │
│  │  ✅ Valid Offer                                              │ │
│  │                                                              │ │
│  │  Offer: "Cold outside? ☕" — 15% off                         │ │
│  │  Customer: Anonymous #2847                                   │ │
│  │  Expires: 12:30 (14 min remaining)                           │ │
│  │  Max discount: €0.68 (on €4.50)                              │ │
│  │                                                              │ │
│  │  Enter transaction amount: [€ 4.50    ]                      │ │
│  │                                                              │ │
│  │  [✅ Confirm Redemption]                                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Merchant App Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/merchant` | Performance overview + live feed |
| Rules | `/merchant/rules` | AI rule configuration (simple form) |
| Analytics | `/merchant/analytics` | Funnel, revenue, history with date filter |
| Scanner | `/merchant/scan` | QR code scanning + validation |
| Offers | `/merchant/offers` | View all AI-generated offers |
| Profile | `/merchant/profile` | Business settings |

---

## 5. Three Core Modules (Technical Detail)

### Module 1: Context Sensing Layer

**Purpose**: Aggregate real-time context signals into a composite state that triggers offer generation.

**Input Signals** (minimum 2 required; we implement 5):

| Signal | Source | Data |
|--------|--------|------|
| 🌤️ Weather | OpenWeatherMap API | temp, feels_like, condition, humidity, wind |
| 📍 Location | Browser Geolocation + Google Places | lat/lon, nearby merchants, distance |
| 🕐 Time | Python datetime | weekday/weekend, time slot, season |
| 📊 Transaction Density | Simulated Payone feed | tx count per merchant per hour vs average |
| 🚶 User Behavior | On-device analysis | intent classification (browsing/commuting/stationary) |

**Composite Context State Output**:
```json
{
    "weather": {
        "temp": 11,
        "feels_like": 8,
        "condition": "overcast",
        "icon": "☁️",
        "trigger": "cold"
    },
    "time": {
        "current": "2025-01-14T12:15:00",
        "slot": "lunch_break",
        "day_type": "weekday",
        "label": "Tuesday Lunch"
    },
    "user_intent": {
        "type": "browsing_food",
        "confidence": 0.85,
        "movement": {
            "avg_speed_kmh": 1.8,
            "stops_10min": 2,
            "direction_variance": "high"
        }
    },
    "nearby_merchants": [
        {
            "place_id": "ChIJ...",
            "name": "Café Scholz",
            "category": "cafe",
            "distance_m": 80,
            "rating": 4.5,
            "photo_url": "https://...",
            "tx_density": {
                "current_hour": 3,
                "avg_hour": 12,
                "status": "very_low",
                "demand_gap": 0.75
            }
        }
    ],
    "events": [],
    "composite_trigger": "warm_drink_opportunity",
    "trigger_score": 0.92
}
```

**Configurability**: City-specific parameters are JSON config files. Switching from Stuttgart to Munich = change config, not code.

### Module 2: Generative Offer Engine

**Purpose**: Autonomously generate targeted offers using AI. This is NOT template-filling — the AI creates headline, discount, visual design, and timing from scratch.

**Merchant Rules (input constraints)**:
```json
{
    "merchant_id": "cafe_scholz",
    "max_discount_percent": 20,
    "target": "fill_quiet_hours",
    "product_scope": ["hot_drinks", "pastries"],
    "brand_tone": "cozy",
    "daily_budget_eur": 50,
    "budget_spent_today": 3.38
}
```

**AI Prompt Structure**:
```
SYSTEM: You are a hyper-local offer generator for City Wallet.
Generate a JSON offer that matches the current context and respects merchant rules.

CONTEXT:
- Weather: {weather.condition} ({weather.temp}°C, feels like {weather.feels_like}°C)
- Time: {time.label} ({time.slot})
- User intent: {user_intent.type} (confidence: {user_intent.confidence})
- Merchant: {merchant.name} ({merchant.category}), {merchant.distance_m}m away
- Merchant demand: {merchant.tx_density.status} (only {current} of {avg} avg transactions)
- Rating: {merchant.rating}★

MERCHANT RULES:
- Max discount: {rules.max_discount_percent}%
- Target: {rules.target}
- Products: {rules.product_scope}
- Tone: {rules.brand_tone}
- Remaining budget: €{rules.daily_budget_eur - rules.budget_spent_today}

OUTPUT FORMAT (JSON):
{
    "headline": "emotional, max 6 words",
    "subtext": "one sentence, situational",
    "discount_percent": number,
    "original_item": "what the offer is for",
    "cta_text": "action button text",
    "mood": "cozy|cool|energetic|warm|fresh",
    "color_primary": "#hex",
    "color_background": "#hex",
    "color_accent": "#hex",
    "icon": "single emoji",
    "valid_minutes": number,
    "reasoning": "why this offer fits this exact moment"
}
```

**GenUI Implementation**: The offer card's colors, icon, layout mood are ALL decided by the AI. The frontend receives this JSON and dynamically renders the card — no predefined templates.

### Module 3: Checkout & Redemption

**Purpose**: Seamless end-to-end flow from offer acceptance to payment completion.

**Flow**:
```
1. User taps "Accept" on offer card
2. Backend generates unique redemption token + QR code
3. QR code displayed on user's phone with countdown
4. User walks to merchant, shows QR code
5. Merchant scans QR → API call validates token
6. Merchant enters transaction amount
7. Backend calculates discount, confirms redemption
8. Cashback amount credited to user's wallet
9. Both dashboards update in real-time
```

**QR Code Token Structure**:
```json
{
    "token": "CW-2025-abc123def456",
    "offer_id": "offer_789",
    "merchant_id": "cafe_scholz",
    "discount_percent": 15,
    "max_discount_eur": 5.00,
    "expires_at": "2025-01-14T12:30:00Z",
    "status": "active"
}
```

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14 (React) + TypeScript | Mobile-responsive web app, SSR |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Maps** | Google Maps JavaScript API | Map display, markers, directions |
| **Charts** | Recharts | Analytics visualizations |
| **QR Code (frontend)** | qrcode.react | Display QR codes |
| **QR Scanner** | html5-qrcode | Merchant-side camera scanning |
| **PWA** | next-pwa | Installable on mobile home screen |
| | | |
| **Backend Framework** | Python FastAPI | Async, high-performance API server |
| **AI Engine** | OpenAI GPT-4o (Python SDK) | Dynamic offer generation |
| **Database** | SQLite (aiosqlite) | Lightweight, zero-config |
| **Weather** | OpenWeatherMap API (httpx) | Real-time weather data |
| **Places** | Google Places API (googlemaps) | Real merchant data, photos, ratings |
| **QR Code (backend)** | qrcode (Python) | Generate QR code images |
| **Data Validation** | Pydantic v2 | Request/response schemas |
| **CORS** | fastapi-cors | Frontend-backend communication |

### External API Keys Required

| API | Key Required | Cost | Purpose |
|-----|-------------|------|---------|
| OpenAI | ✅ Yes | ~$0.01/offer | AI offer generation |
| Google Maps/Places | ✅ Yes## 6. Tech Stack (continued)

### External API Keys Required

| API | Key Required | Cost | Purpose |
|-----|-------------|------|---------|
| OpenAI | Yes | ~$0.01/offer | AI offer generation |
| Google Maps/Places | Yes | $200/mo free tier | Map + real merchant data |
| OpenWeatherMap | Yes | Free tier (60 req/min) | Real-time weather |

---

## 7. API Design

### Context APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/context` | Get full context state (weather + time + merchants + tx density) |
| POST | `/api/context/intent` | Receive user intent signal from device |
| GET | `/api/context/weather?lat=X&lon=Y` | Weather only |
| GET | `/api/context/merchants?lat=X&lon=Y&radius=500` | Nearby merchants from Google Places |

### Offer APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/offers/generate` | AI generates offer from context + rules |
| GET | `/api/offers/{id}` | Get single offer details |
| GET | `/api/offers/active?user_id=X` | Get user's active offers |
| POST | `/api/offers/{id}/accept` | User accepts → generate QR |
| POST | `/api/offers/{id}/dismiss` | User dismisses offer |

### Redemption APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/offers/{id}/redeem` | Merchant scans QR → validate + redeem |
| GET | `/api/redemptions/{id}/qr` | Get QR code image (base64) |
| GET | `/api/wallet/{user_id}` | User wallet balance + history |

### Merchant APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/merchants` | List all merchants |
| GET | `/api/merchants/{id}` | Merchant details |
| PUT | `/api/merchants/{id}/rules` | Update AI rules |
| GET | `/api/merchants/{id}/analytics` | Dashboard data (funnel + revenue) |
| GET | `/api/merchants/{id}/feed` | Live event feed |
| GET | `/api/merchants/{id}/offers` | All offers generated for this merchant |

**Total: 16 API endpoints**

---

## 8. Database Schema

### Tables

**merchants**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Unique merchant ID |
| place_id | TEXT | Google Places ID |
| name | TEXT | Business name |
| category | TEXT | cafe/restaurant/bookstore/etc |
| address | TEXT | Street address |
| lat | REAL | Latitude |
| lon | REAL | Longitude |
| rating | REAL | Google rating |
| photo_url | TEXT | Google photo reference |
| phone | TEXT | Contact phone |
| created_at | DATETIME | Registration date |

**merchant_rules**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto increment |
| merchant_id | TEXT FK | References merchants.id |
| max_discount_percent | INTEGER | 5/10/15/20 |
| target | TEXT | fill_quiet_hours/lunch_rush/rainy_day |
| product_scope | TEXT (JSON) | ["hot_drinks", "pastries"] |
| brand_tone | TEXT | cozy/professional/energetic |
| daily_budget_eur | REAL | Daily spend cap |
| active_hours_start | TEXT | "08:00" or null for auto |
| active_hours_end | TEXT | "18:00" or null for auto |
| is_active | BOOLEAN | Pause/resume offers |
| updated_at | DATETIME | Last update |

**offers**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Unique offer ID |
| merchant_id | TEXT FK | References merchants.id |
| user_id | TEXT | Anonymous user identifier |
| headline | TEXT | AI-generated headline |
| subtext | TEXT | AI-generated subtext |
| discount_percent | INTEGER | Discount amount |
| original_item | TEXT | What the offer is for |
| cta_text | TEXT | Button text |
| mood | TEXT | cozy/warm/cool/energetic |
| color_primary | TEXT | Hex color |
| color_background | TEXT | Hex color |
| color_accent | TEXT | Hex color |
| icon | TEXT | Emoji icon |
| valid_minutes | INTEGER | Offer duration |
| reasoning | TEXT | AI reasoning |
| context_snapshot | TEXT (JSON) | Full context at generation time |
| status | TEXT | generated/displayed/accepted/redeemed/dismissed/expired |
| created_at | DATETIME | Generation time |
| expires_at | DATETIME | Expiry time |
| accepted_at | DATETIME | When accepted (nullable) |
| redeemed_at | DATETIME | When redeemed (nullable) |

**redemptions**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Unique redemption ID |
| offer_id | TEXT FK | References offers.id |
| merchant_id | TEXT FK | References merchants.id |
| token | TEXT UNIQUE | QR code token |
| transaction_amount | REAL | Total purchase amount |
| discount_amount | REAL | Discount applied |
| cashback_amount | REAL | Cashback to user |
| status | TEXT | pending/completed/expired |
| created_at | DATETIME | Token creation |
| completed_at | DATETIME | Redemption completion |

**wallet**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto increment |
| user_id | TEXT | Anonymous user ID |
| balance | REAL | Current cashback balance |
| updated_at | DATETIME | Last update |

**wallet_transactions**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto increment |
| user_id | TEXT | User ID |
| type | TEXT | cashback/withdrawal |
| amount | REAL | Transaction amount |
| description | TEXT | "15% cashback at Cafe Scholz" |
| offer_id | TEXT FK | Related offer |
| created_at | DATETIME | Transaction time |

**simulated_transactions** (Payone simulation)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto increment |
| merchant_id | TEXT FK | References merchants.id |
| amount | REAL | Transaction amount |
| timestamp | DATETIME | Transaction time |

---

## 9. GenUI Design Specification

### Principle
The offer card is NOT a static template. The AI decides the visual presentation based on context. The frontend receives a JSON schema and renders accordingly.

### Dynamic Properties (AI-controlled)

| Property | Example Values | Driven By |
|----------|---------------|-----------|
| color_primary | #8B4513 (warm brown) | Weather + mood |
| color_background | #FFF8DC (cream) | Time of day + mood |
| color_accent | #D2691E (chocolate) | Brand tone |
| icon | ☕ / 🍕 / 📚 / 🍦 | Product category |
| mood | cozy / energetic / fresh | Weather + time + intent |
| headline tone | Emotional vs factual | User profile + context |

### Mood-to-Style Mapping

| Mood | Colors | Font Feel | Animation |
|------|--------|-----------|-----------|
| cozy | Warm browns, creams | Rounded, soft | Gentle fade-in |
| cool | Blues, whites | Clean, minimal | Slide up |
| energetic | Oranges, yellows | Bold, punchy | Bounce in |
| fresh | Greens, light blues | Airy, spacious | Float in |
| warm | Reds, golds | Inviting, rich | Glow effect |

### Card Layout Structure
```
┌─────────────────────────┐
│  [icon]                  │  ← 48px emoji, instant category recognition
│                          │
│  [headline]              │  ← 24px bold, max 6 words, emotional
│  [subtext]               │  ← 16px, one sentence, situational
│                          │
│  [merchant] · [rating]   │  ← 14px, real Google data
│  [distance]              │  ← 14px, from user GPS
│  [discount] · [countdown]│  ← 16px bold, urgency
│                          │
│  [ [icon] [cta_text] ]   │  ← Full-width button, AI-chosen text
└─────────────────────────┘

Background: color_background
Text: auto contrast on background
Button: color_primary, white text
Accent: color_accent for discount badge
```

---

## 10. UX Requirements

The challenge explicitly asks us to address these four questions:

### 1. Where does the interaction happen?

**Primary**: In-app offer card feed (scrollable cards below the map)
**Secondary**: Simulated push notification banner (slides in from top)
**Tertiary**: Map markers that pulse when an offer is generated nearby

Design rationale: In-app cards have the highest engagement because the user is already active. Push notifications risk being ignored but extend reach. Map markers provide spatial awareness.

### 2. How does the offer address the user?

**Emotional-situational by default**: "Cold outside? ☕ Your cappuccino is waiting."
**Factual as supporting detail**: Small text below — "15% off · Café Scholz · 80m · ★4.5"

The AI chooses the emotional framing based on context. Cold weather → warmth and comfort language. Hot weather → refreshment language. Rainy → shelter language.

### 3. What happens in the first 3 seconds?

The offer must be understood WITHOUT scrolling or deliberation:
- **Second 1**: Large emoji icon → instant category recognition (☕ = coffee)
- **Second 2**: Headline in 6 words or fewer → emotional hook
- **Second 3**: Distance + discount + countdown → action trigger

Layout hierarchy enforces this: icon (48px) → headline (24px bold) → details (14px) → CTA button.

### 4. How does the offer end?

| Outcome | User Experience | Animation |
|---------|----------------|-----------|
| **Accept** | Card expands into QR checkout, warm confirmation | Scale up + confetti |
| **Dismiss** | Swipe left, card fades, "Not your vibe? Got it." | Fade out left |
| **Expire** | Countdown hits zero, gentle fade, "Gone, but we'll find another" | Fade down + blur |
| **Ignore** | After 60s without interaction, card minimizes to corner | Shrink to mini |

Each outcome feels intentional and respectful. No pop-ups, no repeat pushes for the same offer.

---

## 11. GDPR Compliance

### Privacy by Design

| Data | Where Processed | Sent to Server? |
|------|----------------|-----------------|
| GPS coordinates | On-device only | NO — only zone name ("altstadt") |
| Movement trajectory | On-device only | NO — only abstract intent |
| Speed / stops | On-device only | NO — only behavior category |
| User preferences | On-device (localStorage) | NO |
| Intent signal | Derived on-device | YES — abstract only ("browsing_food") |
| Offer interactions | Server | YES — anonymized user ID |

### Key Principles

1. **On-device first**: All behavior analysis happens in the browser. Raw GPS data never leaves the device.
2. **Abstract intent signals**: Only `{ intent: "browsing_food", zone: "altstadt" }` is sent — not coordinates.
3. **Anonymous user IDs**: No email, no name, no phone number. Users are `user_abc123`.
4. **Consent flow**: On first launch, clear explanation of what data is used and why. Opt-in for location.
5. **Right to delete**: Settings page includes "Delete all my data" button.
6. **Data minimization**: Offer history auto-expires after 30 days.
7. **No third-party tracking**: No analytics SDKs, no ad pixels, no fingerprinting.

### Architecture Implication
The on-device SLM (Small Language Model) concept from the challenge brief is addressed by running behavior analysis in JavaScript on the client. In a production version, this could be replaced with an actual on-device model (e.g., Phi-3 via WebNN/ONNX Runtime).

---

## 12. Development Milestones

| Phase | Task | Priority |
|-------|------|----------|
| 1 | Project setup (FastAPI + Next.js + SQLite) | 🔴 Critical |
| 2 | Database schema + seed data | 🔴 Critical |
| 3 | Google Places API integration | 🔴 Critical |
| 4 | Context Sensing Layer (weather + time + Payone sim) | 🔴 Critical |
| 5 | Behavior Intent Engine (frontend GPS analysis) | 🟡 Important |
| 6 | Context Aggregation Engine | 🔴 Critical |
| 7 | Generative Offer Engine (OpenAI GPT-4o) | 🔴 Critical |
| 8 | Redemption APIs (QR generation + validation) | 🔴 Critical |
| 9 | Consumer UI — Home (map + context bar + offer cards) | 🔴 Critical |
| 10 | Consumer UI — Offer detail + QR checkout + wallet | 🔴 Critical |
| 11 | Merchant Dashboard + live feed | 🔴 Critical |
| 12 | Merchant Rules configuration page | 🟡 Important |
| 13 | Merchant Analytics page (funnel + charts) | 🟡 Important |
| 14 | Merchant QR Scanner page | 🟡 Important |
| 15 | Demo scenario (Mia's story end-to-end) | 🔴 Critical |
| 16 | GDPR compliance documentation | 🟢 Nice to have |
| 17 | Final polish + README | 🟢 Nice to have |

### Demo Scenario Script

**Two browser windows side by side:**

Left (Consumer — Mia's phone):
1. App opens → Map of Stuttgart old town
2. Context bar shows: "☁️ 11°C Overcast · Tuesday 12:15"
3. Behavior engine detects: "🚶 Browsing · 2 stops"
4. Offer card slides in with AI-generated content
5. Mia taps "Warm Up Now"
6. QR code appears with countdown
7. Simulated redemption → cashback credited

Right (Merchant — Café Scholz dashboard):
1. Dashboard shows today's metrics
2. Live feed: "🤖 Offer Generated" appears
3. Live feed: "✅ Offer Accepted" updates
4. Live feed: "📱 QR Redeemed" with revenue
5. Funnel chart updates in real-time
6. Rules panel visible for quick adjustments

---

## Summary

City Wallet transforms the gap between a person and a perfectly relevant local offer into a seamless, AI-powered experience. It gives DSV Gruppe's local merchant partners access to the personalization infrastructure they have never had — and uses it to make Mia's next fifteen minutes count.

**Three modules, two interfaces, one living wallet.**