# Context Engine — Real-Time Context Aggregation

> Chinese version: [CONTEXT_ENGINE_CN.md](./CONTEXT_ENGINE_CN.md)

## Summary

**Collect all environment signals → package and send to GPT-4o → AI decides whether to trigger an offer and which merchant to choose.**

---

## How It Works

```
User GPS + Intent (on-device)
        ↓
POST /api/context
        ↓
┌─────────────────────────────────────┐
│         Context Engine              │
│                                     │
│  🌤️ Weather (OpenWeatherMap)         │
│  🕐 Time (weekday/slot/season)       │
│  🏪 Nearby Merchants (Google Places) │
│  📊 Tx Density (Payone simulation)   │
│  🚶 User Intent (from device)        │
│                                     │
│  → Composite Trigger Score (0–1)    │
└─────────────────────────────────────┘
        ↓
  score > 0.7 → Generate Offer
  score ≤ 0.7 → No offer this time
```

---

## Five Input Signals

### 1. Weather — OpenWeatherMap
- Temperature, feels_like, condition, humidity, wind
- Trigger types: `cold`, `hot`, `rainy`, `snowy`, `neutral`

### 2. Time Context — System Clock
- Time slots: `early_morning`, `morning`, `lunch_break`, `afternoon`, `evening`, `late_night`
- Day type: `weekday` / `weekend`
- Special: holiday detection

### 3. User Intent — On-Device Classification
All analysis runs in JavaScript on the device. Raw GPS never leaves the phone.

| Pattern | Intent | Action |
|---------|--------|--------|
| Speed > 4 km/h + straight | `commuting` | No offer |
| Speed 1–3 km/h + 2+ stops + zigzag | `browsing_food` | Generate offer |
| Speed 1–3 km/h + zigzag | `browsing_general` | Generate offer |
| Speed < 0.5 km/h | `stationary` | No offer |

### 4. Nearby Merchants — Google Places API
- Real merchant data: name, category, rating, distance, photo
- Search radius: 500m from user location

### 5. Transaction Density — Payone Simulation
- Simulates hourly transaction patterns for each merchant
- `demand_gap` = 1 - (current_hour / avg_hour)
- High demand gap → merchant is quiet → good time for an offer

---

## Composite Trigger Score

```python
trigger_score = weighted_average(
    weather_score,      # cold/rainy weather → higher score
    time_score,         # lunch break / weekend → higher score
    intent_score,       # browsing → higher, commuting → lower
    merchant_demand,    # quiet merchant → higher score
    distance_score      # closer → higher score
)
```

**Threshold: score > 0.7 → proceed to offer generation.**

---

## Context State Output (passed to GPT-4o)

```json
{
    "weather": {
        "temp": 11, "feels_like": 8, "condition": "overcast", "trigger": "cold"
    },
    "time": {
        "slot": "lunch_break", "day_type": "weekday", "label": "Tuesday Lunch"
    },
    "user_intent": {
        "type": "browsing_food", "confidence": 0.85
    },
    "nearby_merchants": [
        {
            "name": "Café Scholz", "category": "cafe", "distance_m": 80,
            "rating": 4.5,
            "tx_density": { "status": "very_low", "demand_gap": 0.75 }
        }
    ],
    "composite_trigger": "warm_drink_opportunity",
    "trigger_score": 0.92
}
```

---

## Why Pass Raw Signals to GPT-4o?

Rather than pre-classifying signals with hardcoded rules, we pass the full context state to GPT-4o and let the model interpret it. This means:

- **No rigid if-else logic** — the AI understands nuance (e.g., "cold + lunch + quiet café" is different from just "cold")
- **Emergent combinations** — the model can recognize patterns we didn't anticipate
- **Natural language reasoning** — the AI explains *why* it chose a particular offer

---

## City Configuration

Each city has its own JSON config file. Switching cities = switching config:

```json
// backend/config/cities/munich.json
{
    "city_id": "munich",
    "name": "Munich",
    "center_lat": 48.1371,
    "center_lon": 11.5754,
    "search_radius_m": 500,
    "timezone": "Europe/Berlin",
    "language": "de"
}
```

---

## GDPR Compliance

| Data | Where Processed | Sent to Server |
|------|----------------|----------------|
| GPS coordinates | On-device JS | ❌ Never |
| Movement speed/direction | On-device JS | ❌ Never |
| Intent classification | On-device JS | ✅ Abstract result only |
| Zone name | Derived on-device | ✅ e.g. "marienplatz" |

The server never sees raw location data. Only `{ intent: "browsing_food", zone: "marienplatz" }` is transmitted.
