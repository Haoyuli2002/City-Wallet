# 🔌 City Wallet — API Documentation

> Chinese version: [API_DOCS_CN.md](./API_DOCS_CN.md)

**Backend URL**: `http://localhost:8000`  
**Format**: JSON  
**CORS**: Enabled for `localhost:3000` and `localhost:3001`  
**Interactive Docs**: http://localhost:8000/docs

---

## API Overview

| Method | Endpoint | Used By | Purpose |
|--------|----------|---------|---------|
| GET | `/api/health` | All | Health check |
| POST | `/api/context` | Consumer App | Get context (weather + merchants + trigger score) |
| POST | `/api/offers/generate` | Consumer App | AI-generate personalized offer (GenUI) |
| GET | `/api/offers/{id}` | All | Get offer details |
| POST | `/api/offers/{id}/accept` | Consumer App | Accept offer → get QR code |
| POST | `/api/offers/{id}/dismiss` | Consumer App | Dismiss offer |
| POST | `/api/offers/{id}/redeem` | Merchant Dashboard | Scan QR + redeem + cashback |
| GET | `/api/wallet/{user_id}` | Consumer App | Wallet balance + history |
| GET | `/api/merchants` | Merchant Dashboard | Merchant list |
| GET | `/api/merchants/{id}` | Merchant Dashboard | Merchant details + rules |
| PUT | `/api/merchants/{id}/rules` | Merchant Dashboard | Update AI rules |
| GET | `/api/merchants/{id}/analytics` | Merchant Dashboard | Funnel + revenue data |
| GET | `/api/merchants/{id}/feed` | Merchant Dashboard | Real-time event feed |
| PUT | `/api/users/{user_id}/preferences` | Consumer App | Set user preferences (cold start) |
| GET | `/api/users/{user_id}/preferences` | Consumer App | Get user preferences |
| GET | `/api/geocode` | All | Place name → coordinates |

---

## I. Consumer App

### POST `/api/context` — Get Environment Context

Retrieve complete real-time context: weather, time, nearby merchants, transaction density, trigger score.

**Request Body**:
```json
{
    "lat": 48.1371,
    "lon": 11.5754,
    "user_intent": "browsing_food",
    "confidence": 0.85,
    "zone": "marienplatz"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | float | ✅ | User latitude |
| lon | float | ✅ | User longitude |
| user_intent | string | ❌ | `browsing_food` / `browsing_general` / `commuting` / `stationary` |
| confidence | float | ❌ | 0–1, default 0.5 |
| zone | string | ❌ | Zone name (GDPR: send zone name, not raw GPS) |

**Response** (200):
```json
{
    "weather": { "temp": 9.7, "feels_like": 9.7, "condition": "Clear", "icon": "☀️" },
    "time": { "datetime": "...", "day_of_week": "Sunday", "is_weekend": true },
    "user_intent": { "type": "browsing_food", "confidence": 0.85 },
    "nearby_merchants": [
        {
            "id": "m_abc123", "name": "Wildmosers Restaurant-Cafe",
            "category": "cafe", "rating": 4.8, "distance_m": 12.4,
            "tx_density": { "current_hour": 0, "avg_hour": 8, "status": "very_low", "demand_gap": 1.0 }
        }
    ],
    "composite_trigger": "breakfast",
    "trigger_score": 0.9,
    "ai_analysis": { "should_trigger": true, "chosen_merchant": "Wildmosers Restaurant-Cafe" }
}
```

**Key**: `trigger_score` > 0.7 → generate an offer.

---

### POST `/api/offers/generate` — AI-Generate Offer (GenUI)

Core endpoint. GPT-4o generates a complete offer JSON from context + merchant rules.

**Request Body**:
```json
{
    "lat": 48.1371, "lon": 11.5754,
    "user_intent": "browsing_food", "confidence": 0.85,
    "zone": "marienplatz", "merchant_id": "m_abc123",
    "user_id": "user_demo_001"
}
```

**Response** (200):
```json
{
    "id": "offer_abc123",
    "merchant": { "id": "m_abc123", "name": "Café Glockenspiel", "rating": 4.6, "distance_m": 80 },
    "content": {
        "headline": "Cold outside? ☕",
        "subtext": "Your cappuccino is waiting, just 80m away",
        "discount_percent": 15,
        "cta_text": "Warm Up Now",
        "mood": "cozy",
        "color_primary": "#8B4513",
        "color_background": "#FFF8DC",
        "color_accent": "#D2691E",
        "icon": "☕",
        "valid_minutes": 15
    },
    "status": "generated",
    "expires_at": "2025-01-14T12:30:00"
}
```

**GenUI rendering guide**:

| Field | How to use |
|-------|-----------|
| `content.color_background` | Card background color |
| `content.color_primary` | Button background |
| `content.color_accent` | Discount badge color |
| `content.icon` | 48px emoji at top |
| `content.mood` | Animation: cozy=fade, energetic=bounce, fresh=slide |
| `content.valid_minutes` | Countdown timer |

---

### POST `/api/offers/{id}/accept` — Accept Offer

Returns QR code and redemption token.

**Response** (200):
```json
{
    "status": "accepted",
    "qr_code": "data:image/png;base64,...",
    "token": "CW-2025-a1b2c3d4e5f6",
    "expires_at": "2025-01-14T12:30:00"
}
```

Use `qr_code` directly as `<img src={qr_code}>`.

---

### POST `/api/offers/{id}/dismiss` — Dismiss Offer

```json
{ "status": "dismissed", "message": "Not your vibe? Got it." }
```

---

### GET `/api/wallet/{user_id}` — Wallet Balance

```json
{
    "user_id": "user_demo_001",
    "balance": 3.24,
    "transactions": [
        { "id": 1, "type": "cashback", "amount": 0.68, "description": "15% cashback at Café Glockenspiel" }
    ]
}
```

---

## II. Merchant Dashboard

### GET `/api/merchants` — Merchant List

```json
[{ "id": "m_abc123", "name": "Café Glockenspiel", "category": "cafe", "rating": 4.6 }]
```

---

### GET `/api/merchants/{id}` — Merchant Details + Rules

```json
{
    "merchant": { "id": "m_abc123", "name": "Café Glockenspiel", "lat": 48.1369, "lon": 11.5752 },
    "rules": {
        "max_discount_percent": 20, "target": "fill_quiet_hours",
        "product_scope": ["hot_drinks", "pastries"], "brand_tone": "cozy",
        "daily_budget_eur": 40.0, "budget_spent_today": 3.38, "is_active": true
    }
}
```

---

### PUT `/api/merchants/{id}/rules` — Update AI Rules

Send only the fields to update:

```json
{ "max_discount_percent": 25, "target": "rainy_day_special", "is_active": false }
```

| Field | Values |
|-------|--------|
| target | `fill_quiet_hours` / `lunch_rush` / `rainy_day_special` / `end_of_day_clearance` |
| brand_tone | `cozy` / `professional` / `energetic` / `warm` / `fresh` |
| max_discount_percent | 5–50 |

---

### GET `/api/merchants/{id}/analytics` — Analytics Data

Query: `?period=today` (options: `today` / `week` / `month`)

```json
{
    "funnel": { "generated": 27, "displayed": 21, "accepted": 8, "redeemed": 5, "dismissed": 5, "expired": 8 },
    "rates": { "acceptance_rate": 0.38, "redemption_rate": 0.63, "conversion_rate": 0.24 },
    "revenue": {
        "total_transaction_value": 22.50, "total_discount_given": 3.38,
        "estimated_incremental_revenue": 19.12, "cost_per_acquisition": 0.68, "roi_percent": 566
    }
}
```

---

### GET `/api/merchants/{id}/feed` — Live Event Feed

Query: `?limit=20`

```json
{
    "merchant_id": "m_abc123",
    "events": [
        { "timestamp": "12:20", "event_type": "offer_redeemed", "icon": "📱", "message": "QR Redeemed · €4.50 · -€0.68 discount" },
        { "timestamp": "12:17", "event_type": "offer_accepted", "icon": "✅", "message": "Accepted: Cold outside? ☕" }
    ]
}
```

`event_type` values: `offer_generated` / `offer_displayed` / `offer_accepted` / `offer_redeemed` / `offer_dismissed` / `offer_expired`

---

### POST `/api/offers/{id}/redeem` — Redeem QR Code

```json
{ "token": "CW-2025-a1b2c3d4e5f6", "transaction_amount": 4.50 }
```

**Success** (200):
```json
{ "status": "redeemed", "discount_applied": 0.68, "cashback_credited": 0.68, "wallet_new_balance": 3.24 }
```

---

### PUT `/api/users/{user_id}/preferences` — Set User Preferences

```json
{ "preferences": { "cafe": 1.0, "bakery": 0.8, "book_store": 0.6, "restaurant": 0.3 } }
```

Blending logic: new user → 100% stated preferences; returning user → 70% behavior history + 30% stated.

---

### GET `/api/geocode` — Geocode Place Name

Query: `?query=Marienplatz Munich`

```json
{ "lat": 48.1371, "lon": 11.5754, "formatted_address": "Marienplatz, 80331 München, Germany" }
```

---

## III. On-Device Intent Engine (Frontend)

Runs entirely in the browser — no backend call needed. Only the result is sent to the backend.

**Intent classification logic**:
```
Speed > 4 km/h + straight path        → "commuting"     (no offers)
Speed 1–3 km/h + 2+ stops + zigzag   → "browsing_food" (lunch hours)
Speed 1–3 km/h + zigzag              → "browsing_general"
Speed < 0.5 km/h                     → "stationary"     (no offers)
```

**What is sent to backend (GDPR compliant)**:
```json
{ "user_intent": "browsing_food", "confidence": 0.85, "zone": "marienplatz" }
```
Raw GPS coordinates are never transmitted.

---

## IV. Error Handling

All errors follow this format:
```json
{ "detail": "Error description" }
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (invalid token, expired offer) |
| 404 | Not found (merchant/offer does not exist) |
| 500 | Server error |

---

## V. Data Flow Summary

**Consumer App**:
```
intentEngine → POST /api/context → POST /api/offers/generate
→ User sees GenUI card → Accept/Dismiss
→ POST /api/offers/{id}/accept → Show QR code
→ Merchant scans → POST /api/offers/{id}/redeem
→ GET /api/wallet/{user_id} → Cashback credited
```

**Merchant Dashboard**:
```
GET /api/merchants → Select store → GET /api/merchants/{id}
→ PUT /api/merchants/{id}/rules (edit rules)
→ GET /api/merchants/{id}/analytics (view funnel)
→ GET /api/merchants/{id}/feed (live events)
→ POST /api/offers/{id}/redeem (scan QR)
```
