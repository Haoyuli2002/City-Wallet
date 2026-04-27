"""
AI Offer Generator — uses OpenAI GPT-4o to dynamically create personalized offers.
The merchant sets rules; the AI creates the creative execution.
"""

import json
from datetime import datetime, timedelta
from uuid import uuid4
from openai import AsyncOpenAI
from config.settings import settings
from models.database import get_db

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def get_merchant_rules(merchant_id: str) -> dict:
    """Fetch merchant's AI rules from database."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM merchant_rules WHERE merchant_id = ?", [merchant_id]
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return {
            "max_discount_percent": 15,
            "target": "fill_quiet_hours",
            "product_scope": '["all"]',
            "brand_tone": "cozy",
            "daily_budget_eur": 50,
            "budget_spent_today": 0,
        }
    finally:
        await db.close()


# ==================== Dynamic Pricing ====================

async def _get_user_dismiss_rate(user_id: str) -> float:
    """Get user's historical offer dismiss rate (0-1)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT 
                COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed,
                COUNT(*) as total
               FROM offers WHERE user_id = ? AND status IN ('accepted','redeemed','dismissed')""",
            [user_id]
        )
        row = await cursor.fetchone()
        if row and row["total"] > 0:
            return round(row["dismissed"] / row["total"], 2)
        return 0.0
    finally:
        await db.close()


def calculate_dynamic_discount(
    max_discount: int,
    demand_gap: float,
    weather_condition: str,
    weather_temp: float,
    distance_m: float,
    user_dismiss_rate: float,
    budget_remaining_pct: float,
) -> dict:
    """
    Dynamic pricing: calculate optimal discount based on multiple factors.
    
    Factors:
    1. Demand gap (primary driver): quiet merchant → higher discount
    2. Weather: bad weather → +2% (harder to attract people)
    3. Distance: farther → +1-3% (more effort to walk)
    4. User dismiss history: high reject rate → +1-3% (need bigger incentive)
    5. Budget remaining: low budget → reduce discount
    
    Returns: {discount, breakdown}
    """
    # 1. Base discount from demand gap
    base_discount = max(5, max_discount * demand_gap)

    # 2. Weather bonus
    weather_bonus = 0
    if weather_condition in ("Rain", "Drizzle", "Thunderstorm", "Snow"):
        weather_bonus = 2
    elif weather_temp < 5:
        weather_bonus = 2
    elif weather_temp < 10:
        weather_bonus = 1

    # 3. Distance bonus
    distance_bonus = 0
    if distance_m > 300:
        distance_bonus = 3
    elif distance_m > 200:
        distance_bonus = 2
    elif distance_m > 100:
        distance_bonus = 1

    # 4. User dismiss rate bonus
    dismiss_bonus = 0
    if user_dismiss_rate > 0.7:
        dismiss_bonus = 3
    elif user_dismiss_rate > 0.5:
        dismiss_bonus = 2
    elif user_dismiss_rate > 0.3:
        dismiss_bonus = 1

    # 5. Budget decay factor
    budget_factor = 1.0
    if budget_remaining_pct < 0.1:
        budget_factor = 0.5
    elif budget_remaining_pct < 0.3:
        budget_factor = 0.7
    elif budget_remaining_pct < 0.5:
        budget_factor = 0.85

    # Combine
    raw_discount = (base_discount + weather_bonus + distance_bonus + dismiss_bonus) * budget_factor
    final_discount = int(min(max_discount, max(5, round(raw_discount))))

    return {
        "discount": final_discount,
        "breakdown": {
            "base_from_demand": round(base_discount, 1),
            "weather_bonus": weather_bonus,
            "distance_bonus": distance_bonus,
            "dismiss_bonus": dismiss_bonus,
            "budget_factor": budget_factor,
            "raw_total": round(raw_discount, 1),
            "final_capped": final_discount,
        },
    }


# ==================== Offer Generation ====================

async def generate_offer(context: dict, merchant: dict, rules: dict = None) -> dict:
    """
    Generate a personalized offer using GPT-4o with dynamic pricing.
    Returns the complete offer data including visual parameters.
    """
    if rules is None:
        rules = await get_merchant_rules(merchant["id"])

    # Build context data
    weather = context.get("weather", {})
    time_ctx = context.get("time", {})
    user_intent = context.get("user_intent", {})
    tx_density = merchant.get("tx_density", {})
    user_id = context.get("user_id", "anonymous")

    # === Dynamic Pricing ===
    max_discount = rules.get("max_discount_percent", 15)
    demand_gap = tx_density.get("demand_gap", 0.5)
    budget_total = rules.get("daily_budget_eur", 50)
    budget_spent = rules.get("budget_spent_today", 0)
    budget_remaining_pct = max(0, (budget_total - budget_spent) / max(budget_total, 1))
    user_dismiss_rate = await _get_user_dismiss_rate(user_id)

    pricing = calculate_dynamic_discount(
        max_discount=max_discount,
        demand_gap=demand_gap,
        weather_condition=weather.get("condition", "Clear"),
        weather_temp=weather.get("temp", 15),
        distance_m=merchant.get("distance_m", 100),
        user_dismiss_rate=user_dismiss_rate,
        budget_remaining_pct=budget_remaining_pct,
    )
    suggested_discount = pricing["discount"]

    # Build the prompt with dynamic pricing hint
    prompt = f"""You are a hyper-local offer generator for City Wallet, an AI-powered city wallet app.
Generate a JSON offer that matches the current context and respects merchant rules.

CURRENT CONTEXT:
- Weather: {weather.get('condition', 'Clouds')} ({weather.get('temp', 15)}°C, feels like {weather.get('feels_like', 13)}°C)
- Time: {time_ctx.get('day_of_week', '?')} {time_ctx.get('date', '?')} {time_ctx.get('time', '?')} (weekend: {time_ctx.get('is_weekend', False)}, holiday: {time_ctx.get('is_holiday', False)})
- User intent: {user_intent.get('type', 'browsing_general')} (confidence: {user_intent.get('confidence', 0.5)})
- Merchant: {merchant.get('name', 'Local Shop')} ({merchant.get('category', 'cafe')})
- Distance: {merchant.get('distance_m', 100)}m from user
- Current demand: {tx_density.get('status', 'normal')} ({tx_density.get('current_hour', 5)} tx this hour vs {tx_density.get('avg_hour', 10)} avg, demand_gap={demand_gap})
- Rating: {merchant.get('rating', 4.0)}★

MERCHANT RULES:
- Max discount: {max_discount}%
- Target: {rules.get('target', 'fill_quiet_hours')}
- Product scope: {rules.get('product_scope', '["all"]')}
- Brand tone: {rules.get('brand_tone', 'cozy')}
- Remaining daily budget: €{round(budget_total - budget_spent, 2)}

DYNAMIC PRICING (system-calculated):
- Suggested discount: {suggested_discount}% (based on demand gap, weather, distance, user history, budget)
- Use this as your discount_percent value. You may adjust ±2% if context strongly suggests it.

Generate a compelling, context-aware offer. The headline should be emotional and situational (max 6 words).

Respond with ONLY valid JSON (no markdown, no code blocks):
{{
    "headline": "emotional headline, max 6 words",
    "subtext": "one sentence, situational description",
    "discount_percent": number_within_merchant_max,
    "original_item": "what the offer is for",
    "cta_text": "action button text",
    "mood": "cozy|warm|cool|energetic|fresh",
    "color_primary": "#hex",
    "color_background": "#hex",
    "color_accent": "#hex",
    "icon": "single emoji",
    "valid_minutes": number_between_10_and_30,
    "reasoning": "one sentence explaining why this offer fits this moment"
}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert local marketing AI. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()
        # Clean up potential markdown formatting
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0]
        
        offer_data = json.loads(content)

    except Exception as e:
        print(f"⚠️ OpenAI API error: {e}. Using fallback offer.")
        # Fallback offer
        offer_data = _generate_fallback_offer(merchant, weather, rules)

    # Validate discount is within rules
    max_discount = rules.get("max_discount_percent", 15)
    if offer_data.get("discount_percent", 10) > max_discount:
        offer_data["discount_percent"] = max_discount

    # Create offer ID and save to database
    offer_id = f"offer_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=offer_data.get("valid_minutes", 120))

    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO offers (id, merchant_id, user_id, headline, subtext, 
               discount_percent, original_item, cta_text, mood, color_primary, 
               color_background, color_accent, icon, valid_minutes, reasoning,
               context_snapshot, status, created_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                offer_id,
                merchant["id"],
                context.get("user_id", "anonymous"),
                offer_data.get("headline", "Special offer for you!"),
                offer_data.get("subtext", ""),
                offer_data.get("discount_percent", 10),
                offer_data.get("original_item", ""),
                offer_data.get("cta_text", "Claim Now"),
                offer_data.get("mood", "cozy"),
                offer_data.get("color_primary", "#8B4513"),
                offer_data.get("color_background", "#FFF8DC"),
                offer_data.get("color_accent", "#D2691E"),
                offer_data.get("icon", "🎁"),
                offer_data.get("valid_minutes", 120),
                offer_data.get("reasoning", ""),
                json.dumps(context),
                "generated",
                now.isoformat(),
                expires_at.isoformat(),
            ]
        )
        await db.commit()
    finally:
        await db.close()

    return {
        "id": offer_id,
        "merchant": {
            "id": merchant["id"],
            "name": merchant.get("name", ""),
            "category": merchant.get("category", ""),
            "rating": merchant.get("rating", 0),
            "photo_url": merchant.get("photo_url"),
            "distance_m": merchant.get("distance_m", 0),
        },
        "content": offer_data,
        "dynamic_pricing": pricing,
        "status": "generated",
        "created_at": now.isoformat() + "Z",
        "expires_at": expires_at.isoformat() + "Z",
    }


def _generate_fallback_offer(merchant: dict, weather: dict, rules: dict) -> dict:
    """Generate a simple fallback offer when OpenAI is unavailable."""
    category = merchant.get("category", "cafe")
    temp = weather.get("temp", 15)

    templates = {
        "cafe": {
            "cold": {"headline": "Warm up inside ☕", "icon": "☕", "item": "cappuccino", "mood": "cozy",
                     "colors": ("#8B4513", "#FFF8DC", "#D2691E")},
            "hot": {"headline": "Cool down here 🧊", "icon": "🧊", "item": "iced latte", "mood": "fresh",
                    "colors": ("#1E90FF", "#F0F8FF", "#87CEEB")},
            "default": {"headline": "Coffee break? ☕", "icon": "☕", "item": "coffee", "mood": "cozy",
                        "colors": ("#8B4513", "#FFF8DC", "#D2691E")},
        },
        "restaurant": {
            "cold": {"headline": "Warm meal waiting 🍲", "icon": "🍲", "item": "daily special", "mood": "warm",
                     "colors": ("#B22222", "#FFF5EE", "#FF6347")},
            "default": {"headline": "Hungry? Step inside 🍽️", "icon": "🍽️", "item": "lunch special", "mood": "professional",
                        "colors": ("#2F4F4F", "#F5F5F5", "#708090")},
        },
        "bakery": {
            "default": {"headline": "Fresh from the oven 🥖", "icon": "🥖", "item": "pastry", "mood": "warm",
                        "colors": ("#DAA520", "#FFFACD", "#FFD700")},
        },
        "bar": {
            "default": {"headline": "Happy hour awaits 🍺", "icon": "🍺", "item": "drink", "mood": "energetic",
                        "colors": ("#800080", "#F8F0FF", "#9370DB")},
        },
        "book_store": {
            "default": {"headline": "Find your next read 📚", "icon": "📚", "item": "book", "mood": "cozy",
                        "colors": ("#4169E1", "#F0F8FF", "#6495ED")},
        },
    }

    cat_templates = templates.get(category, templates["cafe"])
    weather_key = "cold" if temp < 10 else ("hot" if temp > 28 else "default")
    t = cat_templates.get(weather_key, cat_templates.get("default", templates["cafe"]["default"]))

    discount = min(10, rules.get("max_discount_percent", 15))

    return {
        "headline": t["headline"],
        "subtext": f"Visit {merchant.get('name', 'us')} — just {merchant.get('distance_m', 100)}m away",
        "discount_percent": discount,
        "original_item": t["item"],
        "cta_text": f"{t['icon']} Visit Now",
        "mood": t["mood"],
        "color_primary": t["colors"][0],
        "color_background": t["colors"][1],
        "color_accent": t["colors"][2],
        "icon": t["icon"],
        "valid_minutes": 120,
        "reasoning": f"Fallback offer for {category} — weather: {weather.get('trigger', 'nice')}",
    }