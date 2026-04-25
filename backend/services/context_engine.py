"""
Context aggregation engine — the brain of City Wallet.
Collects all signals (weather, time, location, transaction density, user intent)
and sends them to GPT-4o for intelligent analysis instead of hardcoded scoring.
"""

import json
from datetime import datetime
from openai import AsyncOpenAI
from config.settings import settings
from services.weather import get_weather
from services.places import search_nearby
from services.transaction_sim import get_current_density

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def _get_time_context() -> dict:
    """Analyze current time and return time context."""
    now = datetime.now()
    hour = now.hour
    weekday = now.weekday()

    day_type = "weekend" if weekday >= 5 else "weekday"

    if 6 <= hour < 8:
        slot = "early_morning"
    elif 8 <= hour < 11:
        slot = "morning"
    elif 11 <= hour < 14:
        slot = "lunch_break"
    elif 14 <= hour < 17:
        slot = "afternoon"
    elif 17 <= hour < 21:
        slot = "evening"
    else:
        slot = "night"

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    slot_labels = {
        "early_morning": "Early Morning", "morning": "Morning",
        "lunch_break": "Lunch", "afternoon": "Afternoon",
        "evening": "Evening", "night": "Night",
    }
    label = f"{days[weekday]} {slot_labels.get(slot, slot)}"

    return {"current": now.isoformat(), "slot": slot, "day_type": day_type, "label": label}


async def _ai_analyze_context(weather: dict, time_ctx: dict, user_intent: str,
                               confidence: float, merchants: list) -> dict:
    """
    Send all context signals to GPT-4o for intelligent analysis.
    AI decides: should we show an offer? which merchant? what type?
    """
    # Build merchant summary for the prompt
    merchant_summaries = []
    for i, m in enumerate(merchants[:8]):  # Top 8 merchants
        tx = m.get("tx_density", {})
        merchant_summaries.append(
            f"  {i+1}. {m['name']} ({m['category']}) — {m.get('distance_m', '?')}m away, "
            f"★{m.get('rating', 0)}, demand: {tx.get('status', 'unknown')} "
            f"({tx.get('current_hour', 0)} tx now vs {tx.get('avg_hour', 0)} avg)"
        )
    merchants_text = "\n".join(merchant_summaries) if merchant_summaries else "  No merchants nearby"

    prompt = f"""You are the context analysis engine for City Wallet, an AI-powered local offer app.

Analyze the following real-time context and decide whether to trigger a personalized offer.

CURRENT CONTEXT:
- Weather: {weather.get('condition', 'unknown')} ({weather.get('temp', '?')}°C, feels like {weather.get('feels_like', '?')}°C), {weather.get('description', '')}
- Time: {time_ctx.get('label', 'unknown')} ({time_ctx.get('slot', 'unknown')}, {time_ctx.get('day_type', 'unknown')})
- User behavior: {user_intent} (confidence: {confidence})
- Nearby merchants:
{merchants_text}

RULES:
- Only trigger if the context genuinely suggests the user would benefit from an offer
- "commuting" or "stationary" users should rarely get offers
- Prefer merchants that are quiet (low demand) AND close AND relevant to the user's likely need
- Consider weather-category fit (cold→warm drinks, hot→cold drinks, rain→indoor, etc.)
- Consider time-category fit (morning→coffee, lunch→food, evening→drinks/dinner)

Respond with ONLY valid JSON (no markdown):
{{
    "should_trigger": true or false,
    "confidence": 0.0 to 1.0,
    "best_merchant_index": 0-based index from the merchant list (or -1 if none),
    "trigger_type": "warm_drink" | "cold_drink" | "quick_meal" | "snack" | "shelter" | "evening_out" | "browse" | "none",
    "reasoning": "one sentence explaining your decision",
    "suggested_category": "what type of offer would fit best"
}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a context analysis AI. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,  # Lower temperature for more consistent decisions
            max_tokens=300,
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0]

        analysis = json.loads(content)
        return analysis

    except Exception as e:
        print(f"⚠️ AI context analysis failed: {e}. Using fallback.")
        return _fallback_analysis(weather, time_ctx, user_intent, confidence, merchants)


def _fallback_analysis(weather: dict, time_ctx: dict, user_intent: str,
                       confidence: float, merchants: list) -> dict:
    """Simple fallback if GPT-4o is unavailable."""
    if user_intent == "commuting":
        return {"should_trigger": False, "confidence": 0.1, "best_merchant_index": -1,
                "trigger_type": "none", "reasoning": "User is commuting", "suggested_category": "none"}

    should = user_intent in ("browsing_food", "browsing_general") and len(merchants) > 0
    return {
        "should_trigger": should,
        "confidence": 0.6 if should else 0.2,
        "best_merchant_index": 0 if merchants else -1,
        "trigger_type": "warm_drink" if weather.get("trigger") == "cold" else "quick_meal",
        "reasoning": "Fallback: user is browsing near merchants",
        "suggested_category": merchants[0]["category"] if merchants else "none",
    }


async def build_context(lat: float, lon: float, user_intent: str = "browsing_general",
                        confidence: float = 0.5, zone: str = "unknown") -> dict:
    """
    Main entry point: collect all signals and let AI analyze the context.
    """
    # 1. Get weather
    weather = await get_weather(lat, lon)

    # 2. Get time context
    time_ctx = _get_time_context()

    # 3. Get nearby merchants
    merchants = await search_nearby(lat, lon, radius=500)

    # 4. Add transaction density to each merchant
    for m in merchants:
        m["tx_density"] = await get_current_density(m["id"])

    # 5. Sort by demand gap (quietest first)
    merchants.sort(key=lambda m: m.get("tx_density", {}).get("demand_gap", 0), reverse=True)

    # 6. AI analyzes the context (replaces hardcoded scoring)
    ai_analysis = await _ai_analyze_context(weather, time_ctx, user_intent, confidence, merchants)

    # 7. Map AI response to our format
    trigger_score = ai_analysis.get("confidence", 0.5) if ai_analysis.get("should_trigger") else 0.0
    best_idx = ai_analysis.get("best_merchant_index", 0)

    # Reorder merchants: put AI's recommended merchant first
    if 0 <= best_idx < len(merchants):
        best = merchants.pop(best_idx)
        merchants.insert(0, best)

    return {
        "weather": weather,
        "time": time_ctx,
        "user_intent": {
            "type": user_intent,
            "confidence": confidence,
        },
        "nearby_merchants": merchants[:10],
        "events": [],
        "composite_trigger": ai_analysis.get("trigger_type", "none"),
        "trigger_score": trigger_score,
        "ai_analysis": {
            "should_trigger": ai_analysis.get("should_trigger", False),
            "reasoning": ai_analysis.get("reasoning", ""),
            "suggested_category": ai_analysis.get("suggested_category", ""),
        },
    }