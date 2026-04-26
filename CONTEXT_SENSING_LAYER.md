# 📡 Context Sensing Layer

## Overview

The Context Sensing Layer collects **5 real-time signal categories** from independent data sources. All signals are passed as **raw data** to GPT-4o — no pre-classification or hardcoded rules. The AI interprets the signals directly.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 🌤️ Weather   │  │ 📍 Location  │  │ 🕐 Time      │  │ 📊 Tx Density│  │ 🚶 Intent   │
│ OpenWeather  │  │ Google Places│  │ Server Clock │  │ Payone Sim  │  │ Device GPS  │
│ Map API      │  │ + Haversine  │  │ + Holidays   │  │ + 30-day avg│  │ (on-device) │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │                 │
       └────────────────┴────────────────┴────────────────┴────────────────┘
                                          │
                                          ▼
                                 Context Aggregation
                                 → Top 5 by demand
                                 → Top 5 by preference
                                 → LLM as Judge
```

---

## Signal 1: 🌤️ Weather

**Source**: OpenWeatherMap API  
**File**: `backend/services/weather.py`  
**Cache**: 10 minutes (same location won't re-fetch)  
**Fallback**: Simulated Munich weather if API key missing

### What it returns (raw data, no labels)

```json
{
    "temp": 8.3,
    "feels_like": 5.1,
    "condition": "Rain",
    "description": "light rain",
    "humidity": 82,
    "wind_speed": 4.1,
    "icon": "🌧️"
}
```

### Example scenario
> It's 8°C with light rain in Munich. GPT-4o reads this and understands: "cold and rainy → user probably wants somewhere warm and dry → suggest indoor café or restaurant with warm drinks."

### How GPT-4o uses it
The raw values `"Rain, 8°C, feels like 5°C"` are included directly in the LLM prompt. The AI naturally understands weather-need relationships without us coding `if rain then indoor`.

---

## Signal 2: 📍 Location + Nearby Merchants

**Source**: SQLite database (seeded from Google Places API)  
**File**: `backend/services/places.py`  
**Range**: 500m radius from user  
**Distance**: Haversine formula (GPS coordinates → meters)

### What it returns

```json
[
    {
        "id": "m_abc123",
        "name": "Café Glockenspiel",
        "category": "cafe",
        "address": "Marienplatz 28, Munich",
        "lat": 48.1369,
        "lon": 11.5752,
        "rating": 4.6,
        "photo_url": "https://maps.googleapis.com/...",
        "distance_m": 80
    },
    {
        "id": "m_def456",
        "name": "Hofbräuhaus München",
        "category": "restaurant",
        "address": "Platzl 9, Munich",
        "rating": 4.3,
        "distance_m": 200
    }
]
```

### Example scenario
> User is standing at Marienplatz. System finds 25 merchants within 500m: 5 cafés, 5 restaurants, 5 bakeries, 5 bars, 5 bookstores. Café Glockenspiel is closest at 80m.

### Haversine distance calculation
```
User: (48.1371, 11.5754)
Café:  (48.1369, 11.5752)
→ Haversine distance = 80 meters
```

---

## Signal 3: 🕐 Time

**Source**: Server local time + Python `holidays` library  
**File**: `backend/services/context_engine.py`  
**Holiday detection**: German Bavaria public holidays (Christmas, Easter, Oktoberfest holiday, etc.)

### What it returns (raw datetime, no slot labels)

```json
{
    "datetime": "2026-04-26T06:53:00",
    "date": "2026-04-26",
    "time": "06:53",
    "day_of_week": "Sunday",
    "is_weekend": true,
    "is_holiday": false,
    "holiday_name": null
}
```

### Example: Regular weekday
```json
{
    "datetime": "2026-01-14T12:15:00",
    "date": "2026-01-14",
    "time": "12:15",
    "day_of_week": "Wednesday",
    "is_weekend": false,
    "is_holiday": false,
    "holiday_name": null
}
```
> GPT-4o reads "Wednesday 12:15" and understands: lunchtime on a weekday → user likely looking for lunch.

### Example: Public holiday
```json
{
    "datetime": "2026-12-25T10:30:00",
    "date": "2026-12-25",
    "time": "10:30",
    "day_of_week": "Friday",
    "is_weekend": false,
    "is_holiday": true,
    "holiday_name": "Erster Weihnachtstag"
}
```
> GPT-4o reads "Christmas Day 10:30am" and understands: holiday morning, many shops closed, suggest open cafés with holiday specials.

---

## Signal 4: 📊 Transaction Density (Payone Data)

**Source**: SQLite database (simulated Payone POS transaction records)  
**File**: `backend/services/transaction_sim.py`  
**Comparison**: Current hour tx count vs past 30 days same-hour average  
**This is DSV/Payone's unique data advantage**

### What it returns (per merchant)

```json
{
    "current_hour": 3,
    "avg_hour": 12,
    "status": "very_low",
    "demand_gap": 0.75
}
```

### Status classification

| Ratio (current/avg) | Status | Meaning |
|---------------------|--------|---------|
| ≤ 25% | `very_low` | Much quieter than usual |
| ≤ 50% | `low` | Quieter than usual |
| ≤ 120% | `normal` | About average |
| ≤ 180% | `busy` | Busier than usual |
| > 180% | `very_busy` | Much busier than usual |

### Example: Quiet café
```
Café Glockenspiel at 12:00 today: 3 transactions
Past 30 days average at 12:00: 12 transactions
ratio = 3/12 = 0.25 → status: "very_low"
demand_gap = 1 - 0.25 = 0.75 → 75% demand gap
```
> This café is serving only 25% of its usual lunch crowd. It needs customers → high priority for offer generation.

### Example: Busy restaurant
```
Hofbräuhaus at 19:00 today: 22 transactions
Past 30 days average at 19:00: 15 transactions
ratio = 22/15 = 1.47 → status: "busy"
demand_gap = 0 → no gap, doesn't need more customers
```
> Hofbräuhaus is already 47% busier than usual. No need to send offers here.

---

## Signal 5: 🚶 User Behavior Intent

**Source**: User's phone GPS (processed entirely on-device)  
**File**: Frontend `consumer-app/src/lib/intentEngine.ts`  
**Privacy**: Only abstract intent sent to backend — raw GPS never leaves device (GDPR compliant)

### What the frontend sends to backend

```json
{
    "user_intent": "browsing_food",
    "confidence": 0.85
}
```

### 4 Intent Types

| Intent | GPS Pattern | What it means | System response |
|--------|------------|---------------|-----------------|
| `commuting` | Speed > 4 km/h, straight path | User is walking fast, going somewhere | ❌ Don't push offers |
| `stationary` | Speed < 0.5 km/h | User is standing still, likely already in a shop | ❌ Don't push offers |
| `browsing_food` | Speed 1-3 km/h, 2+ stops, around meal time | User is wandering, looking for food | ✅ Push food/drink offers |
| `browsing_general` | Speed 1-3 km/h, zigzag pattern | User is casually strolling | ✅ Push café, dessert, bookstore offers |

### Example: Browsing for food
```
GPS trajectory (last 10 minutes):
  12:05 — walking south slowly (1.5 km/h)
  12:07 — stopped for 40 seconds (looking at menu?)
  12:09 — walking east slowly (1.2 km/h)
  12:11 — stopped for 30 seconds
  12:13 — walking north (direction changed)
  12:15 — still walking slowly, zigzag pattern

Analysis:
  avg_speed = 1.8 km/h (slow)
  stops = 2 (window shopping)
  direction_changes = 4 (not going somewhere specific)
  time = 12:15 (lunchtime)

→ Intent: "browsing_food", confidence: 0.85
```

### Example: Commuting
```
GPS trajectory (last 10 minutes):
  08:30 — walking north fast (5.2 km/h)
  08:32 — still walking north (5.0 km/h)
  08:34 — still walking north (4.8 km/h)
  08:36 — still walking north (5.1 km/h)

Analysis:
  avg_speed = 5.0 km/h (fast)
  stops = 0
  direction_changes = 0 (straight line)

→ Intent: "commuting", confidence: 0.92
→ System: do NOT push any offer
```

---

## How All 5 Signals Come Together

```
User opens app at Marienplatz, Munich

Signal 1 (Weather):  Rain, 8°C, feels like 5°C
Signal 2 (Location): 25 merchants within 500m, closest: Café Glockenspiel 80m
Signal 3 (Time):     Sunday 06:53, weekend, not a holiday
Signal 4 (Tx Density): Café Glockenspiel has 75% demand gap (very quiet)
Signal 5 (Intent):   browsing_food, confidence 0.85

        ↓ All 5 signals collected ↓

Step 1: Top 5 merchants by demand gap (most quiet)
Step 2: Top 5 merchants by user's 7-day preference history
Step 3: LLM as Judge — GPT-4o considers ALL signals + user interest + merchant need
        → Picks: Café Glockenspiel
        → Reasoning: "Rainy Sunday morning, user browsing for food,
                      café is very quiet and just 80m away, user historically prefers cafés"
        → Trigger type: "warm_drink"
        → Confidence: 0.88
```

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Raw data, no pre-labels** | Weather and time sent as-is to GPT-4o |
| **Privacy first** | GPS stays on device, only intent sent |
| **Configurable** | Change city = change coordinates + re-seed |
| **Fault tolerant** | Every signal has fallback (simulated data) |
| **DSV advantage** | Transaction density is Payone's unique asset |