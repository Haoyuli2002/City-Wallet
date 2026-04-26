"""
Context aggregation engine — the brain of City Wallet.

Three-step recommendation:
1. Top 5 merchants by demand gap (most need customers)
2. Top 5 merchants by user preference (7-day behavior history)
3. LLM as Judge: GPT-4o picks the best one considering current context
"""

import json
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from config.settings import settings
from services.weather import get_weather
from services.places import search_nearby
from services.transaction_sim import get_current_density
from models.database import get_db

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def _get_time_context() -> dict:
    """Return real time data — GPT-4o interprets it directly.
    No pre-classification into slots. Includes holiday detection for Bavaria/Germany.
    """
    import holidays
    now = datetime.now()
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Holiday detection (Bavaria, Germany)
    de_holidays = holidays.Germany(state="BY", years=now.year)
    is_holiday = now.date() in de_holidays
    holiday_name = de_holidays.get(now.date(), None)

    return {
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "day_of_week": days[now.weekday()],
        "is_weekend": now.weekday() >= 5,
        "is_holiday": is_holiday,
        "holiday_name": holiday_name,
    }


# ==================== Step 1: Top 5 by Demand Gap ====================

def _get_top5_by_demand(merchants: list) -> list:
    """Get top 5 merchants sorted by demand gap (most quiet first)."""
    sorted_m = sorted(merchants, key=lambda m: m.get("tx_density", {}).get("demand_gap", 0), reverse=True)
    return sorted_m[:5]


# ==================== Step 2: Top 5 by User Preference ====================

async def _get_explicit_preferences(user_id: str) -> dict:
    """Get user's self-selected interest preferences (cold start)."""
    import json as _json
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT preferences FROM user_preferences WHERE user_id = ?", [user_id]
        )
        row = await cursor.fetchone()
        if row:
            return _json.loads(row["preferences"])
        return {}
    finally:
        await db.close()


async def _get_user_history(user_id: str) -> list:
    """Get user's offer interaction history from past 7 days (max 21 records)."""
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT o.merchant_id, m.category, m.name, o.status, o.discount_percent, o.created_at
               FROM offers o JOIN merchants m ON o.merchant_id = m.id
               WHERE o.user_id = ? AND o.created_at >= ?
               ORDER BY o.created_at DESC LIMIT 21""",
            [user_id, seven_days_ago]
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


def _calculate_preference_scores(history: list) -> dict:
    """Calculate preference score per category from user history.
    
    Score = (accepted * 1.0 + redeemed * 1.5 - dismissed * 0.5) / max(total, 1)
    Range: roughly -0.5 to 1.5, higher = user likes this category more
    """
    category_stats = {}
    for record in history:
        cat = record["category"]
        if cat not in category_stats:
            category_stats[cat] = {"accepted": 0, "redeemed": 0, "dismissed": 0, "total": 0}
        category_stats[cat]["total"] += 1
        if record["status"] == "accepted":
            category_stats[cat]["accepted"] += 1
        elif record["status"] == "redeemed":
            category_stats[cat]["redeemed"] += 1
        elif record["status"] == "dismissed":
            category_stats[cat]["dismissed"] += 1

    scores = {}
    for cat, stats in category_stats.items():
        total = max(stats["total"], 1)
        score = (stats["accepted"] * 1.0 + stats["redeemed"] * 1.5 - stats["dismissed"] * 0.5) / total
        scores[cat] = round(score, 2)

    return scores


def _get_top5_by_preference(merchants: list, preference_scores: dict) -> list:
    """Get top 5 merchants matching user preferences, with distance decay."""
    for m in merchants:
        cat_score = preference_scores.get(m["category"], 0.3)  # Default 0.3 for unknown
        distance = m.get("distance_m", 200)
        distance_decay = max(0, 1 - distance / 500)  # 0m=1.0, 500m=0.0
        m["interest_score"] = round(cat_score * 0.7 + distance_decay * 0.3, 2)

    sorted_m = sorted(merchants, key=lambda m: m.get("interest_score", 0), reverse=True)
    return sorted_m[:5]


# ==================== Step 3: LLM as Judge ====================

async def _llm_judge(candidates: list, weather: dict, time_ctx: dict,
                     user_intent: str, confidence: float,
                     preference_scores: dict, history_summary: str) -> dict:
    """
    LLM as Judge: GPT-4o picks the best merchant from candidates
    considering BOTH merchant need AND user interest AND current context.
    """
    candidate_lines = []
    for i, m in enumerate(candidates):
        tx = m.get("tx_density", {})
        candidate_lines.append(
            f"  {i+1}. {m['name']} ({m['category']}) — {m.get('distance_m', '?')}m, "
            f"★{m.get('rating', 0)}, demand: {tx.get('status', '?')} "
            f"(gap={tx.get('demand_gap', 0)}), "
            f"user_preference: {m.get('interest_score', 0.3)}"
        )
    candidates_text = "\n".join(candidate_lines)

    pref_text = ", ".join([f"{k}={v}" for k, v in sorted(preference_scores.items(), key=lambda x: -x[1])])

    prompt = f"""You are the final recommendation judge for City Wallet.

CANDIDATES (from two selection strategies):
{candidates_text}

CURRENT CONTEXT:
- Weather: {weather.get('condition', '?')} ({weather.get('temp', '?')}°C, feels like {weather.get('feels_like', '?')}°C)
- Time: {time_ctx.get('day_of_week', '?')} {time_ctx.get('date', '?')} {time_ctx.get('time', '?')} (weekend: {time_ctx.get('is_weekend', False)}, holiday: {time_ctx.get('is_holiday', False)}{', ' + time_ctx['holiday_name'] if time_ctx.get('holiday_name') else ''})
- User intent: {user_intent} (confidence: {confidence})

USER PREFERENCE (from past 7 days):
- Preference scores: {pref_text if pref_text else 'no history yet'}
- History: {history_summary if history_summary else 'new user, no history'}

SELECTION CRITERIA (consider ALL of these):
1. User interest: pick something the user is likely to ACCEPT (based on preference scores)
2. Merchant need: prefer merchants that are QUIET and need customers (high demand_gap)
3. Context fit: match weather (cold→warm drinks, rain→indoor) and time (morning→coffee, lunch→food)
4. Distance: closer is better
5. Rating: higher rated merchants provide better experience

Choose exactly ONE merchant. Respond with ONLY valid JSON:
{{
    "chosen_index": 0-based index from candidate list,
    "merchant_name": "name",
    "reasoning": "one sentence explaining why this is the best choice right now",
    "trigger_type": "warm_drink" | "cold_drink" | "quick_meal" | "snack" | "breakfast" | "dinner" | "shelter" | "evening_out" | "weekend_brunch" | "afternoon_tea" | "browse" | "rainy_day_read" | "fresh_bread" | "happy_hour" | "none",
    "confidence": 0.0 to 1.0
}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a recommendation judge AI. Pick the single best merchant. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0]
        return json.loads(content)
    except Exception as e:
        print(f"⚠️ LLM Judge failed: {e}. Using fallback.")
        return {
            "chosen_index": 0,
            "merchant_name": candidates[0]["name"] if candidates else "unknown",
            "reasoning": "Fallback: selected first candidate",
            "trigger_type": "browse",
            "confidence": 0.4,
        }


# ==================== Main Entry Point ====================

async def build_context(lat: float, lon: float, user_intent: str = "browsing_general",
                        confidence: float = 0.5, zone: str = "unknown",
                        user_id: str = "anonymous") -> dict:
    """
    Main entry point: three-step recommendation.
    1. Top 5 by demand gap
    2. Top 5 by user preference (7-day history)
    3. LLM as Judge picks the winner
    """
    # Collect signals
    weather = await get_weather(lat, lon)
    time_ctx = _get_time_context()
    merchants = await search_nearby(lat, lon, radius=500)

    # Add transaction density to each merchant
    for m in merchants:
        m["tx_density"] = await get_current_density(m["id"])

    # Step 1: Top 5 by demand gap
    top5_demand = _get_top5_by_demand(merchants)

    # Step 2: Top 5 by user preference (explicit + history merged)
    explicit_prefs = await _get_explicit_preferences(user_id)
    history = await _get_user_history(user_id)
    history_scores = _calculate_preference_scores(history)

    # Merge: explicit (cold start) + history (behavioral)
    # If user has history, weight: 70% history + 30% explicit
    # If no history, use 100% explicit
    # If neither, all categories default to 0.3
    all_categories = set(list(explicit_prefs.keys()) + list(history_scores.keys()))
    preference_scores = {}
    for cat in all_categories:
        exp = explicit_prefs.get(cat, 0.3)
        hist = history_scores.get(cat)
        if hist is not None and len(history) > 0:
            preference_scores[cat] = round(hist * 0.7 + exp * 0.3, 2)
        else:
            preference_scores[cat] = round(exp, 2)

    top5_preference = _get_top5_by_preference(list(merchants), preference_scores)

    # Merge candidates (deduplicate by id)
    seen_ids = set()
    candidates = []
    for m in top5_demand + top5_preference:
        if m["id"] not in seen_ids:
            seen_ids.add(m["id"])
            candidates.append(m)

    # Build history summary for LLM
    if history:
        accepted_cats = [h["category"] for h in history if h["status"] in ("accepted", "redeemed")]
        dismissed_cats = [h["category"] for h in history if h["status"] == "dismissed"]
        history_summary = f"Accepted {len(accepted_cats)} offers ({', '.join(set(accepted_cats)) or 'none'}), dismissed {len(dismissed_cats)} ({', '.join(set(dismissed_cats)) or 'none'}) in past 7 days"
    else:
        history_summary = ""

    # Step 3: LLM as Judge
    if candidates and user_intent != "commuting":
        judge_result = await _llm_judge(
            candidates, weather, time_ctx,
            user_intent, confidence,
            preference_scores, history_summary
        )
    else:
        judge_result = {
            "chosen_index": -1,
            "merchant_name": "",
            "reasoning": "User is commuting or no candidates available",
            "trigger_type": "none",
            "confidence": 0.0,
        }

    # Reorder merchants: put judge's chosen merchant first
    chosen_idx = judge_result.get("chosen_index", 0)
    should_trigger = judge_result.get("confidence", 0) > 0.3 and chosen_idx >= 0

    if should_trigger and 0 <= chosen_idx < len(candidates):
        chosen_merchant = candidates[chosen_idx]
        # Move chosen to front of full merchant list
        merchants = [m for m in merchants if m["id"] != chosen_merchant["id"]]
        merchants.insert(0, chosen_merchant)

    trigger_score = judge_result.get("confidence", 0) if should_trigger else 0.0

    return {
        "weather": weather,
        "time": time_ctx,
        "user_intent": {"type": user_intent, "confidence": confidence},
        "nearby_merchants": merchants[:10],
        "events": [],
        "composite_trigger": judge_result.get("trigger_type", "none"),
        "trigger_score": trigger_score,
        "ai_analysis": {
            "should_trigger": should_trigger,
            "reasoning": judge_result.get("reasoning", ""),
            "suggested_category": judge_result.get("trigger_type", "none"),
            "chosen_merchant": judge_result.get("merchant_name", ""),
        },
        "recommendation_details": {
            "top5_demand": [{"name": m["name"], "category": m["category"], "demand_gap": m.get("tx_density", {}).get("demand_gap", 0)} for m in top5_demand],
            "top5_preference": [{"name": m["name"], "category": m["category"], "interest_score": m.get("interest_score", 0)} for m in top5_preference],
            "total_candidates": len(candidates),
            "user_preference_scores": preference_scores,
            "history_count": len(history),
        },
    }