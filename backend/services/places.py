"""
Google Places service — searches nearby merchants dynamically.
1. First checks local database (already seeded merchants)
2. If no merchants found nearby, fetches LIVE from Google Places API
3. Saves fetched merchants to database for future use
4. 30-minute cache to avoid excessive API calls
"""

import math
import json
import time
from uuid import uuid4
import googlemaps
from config.settings import settings
from models.database import get_db

# Cache: {location_key: (timestamp, merchants)}
_cache = {}
CACHE_TTL = 1800  # 30 minutes


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters."""
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


async def _search_db(lat: float, lon: float, radius: int = 500) -> list:
    """Search nearby merchants from local database."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM merchants")
        rows = await cursor.fetchall()
        merchants = []
        for row in rows:
            dist = _haversine_distance(lat, lon, row["lat"], row["lon"])
            if dist <= radius:
                merchants.append({
                    "id": row["id"],
                    "place_id": row["place_id"],
                    "name": row["name"],
                    "category": row["category"],
                    "address": row["address"],
                    "lat": row["lat"],
                    "lon": row["lon"],
                    "rating": row["rating"],
                    "photo_url": row["photo_url"],
                    "distance_m": dist,
                })
        merchants.sort(key=lambda x: x["distance_m"])
        return merchants
    finally:
        await db.close()


async def _fetch_from_google(lat: float, lon: float, radius: int = 500) -> list:
    """Fetch merchants LIVE from Google Places API and save to database."""
    if not settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_MAPS_API_KEY == "your-google-maps-api-key-here":
        print("⚠️ No Google Maps API key — cannot fetch live merchants")
        return []

    try:
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        merchants = []
        search_types = ["cafe", "restaurant", "bakery", "bar", "book_store"]

        for place_type in search_types:
            results = gmaps.places_nearby(
                location=(lat, lon),
                radius=radius,
                type=place_type,
                language="en"
            )

            for place in results.get("results", [])[:5]:
                photo_url = None
                if place.get("photos"):
                    photo_ref = place["photos"][0].get("photo_reference")
                    if photo_ref:
                        photo_url = (
                            f"https://maps.googleapis.com/maps/api/place/photo"
                            f"?maxwidth=400&photo_reference={photo_ref}"
                            f"&key={settings.GOOGLE_MAPS_API_KEY}"
                        )

                merchant = {
                    "id": f"m_{uuid4().hex[:8]}",
                    "place_id": place.get("place_id", ""),
                    "name": place.get("name", "Unknown"),
                    "category": place_type,
                    "address": place.get("vicinity", ""),
                    "lat": place["geometry"]["location"]["lat"],
                    "lon": place["geometry"]["location"]["lng"],
                    "rating": place.get("rating", 0),
                    "photo_url": photo_url,
                    "distance_m": _haversine_distance(
                        lat, lon,
                        place["geometry"]["location"]["lat"],
                        place["geometry"]["location"]["lng"]
                    ),
                }
                merchants.append(merchant)

        # Save to database for future use
        if merchants:
            await _save_to_db(merchants)
            # Also generate default rules and simulated transactions
            await _generate_defaults(merchants)

        print(f"✅ Fetched {len(merchants)} merchants from Google Places API")
        return merchants

    except Exception as e:
        print(f"⚠️ Google Places API error: {e}")
        return []


async def _save_to_db(merchants: list):
    """Save fetched merchants to database."""
    db = await get_db()
    try:
        for m in merchants:
            # Check if already exists (by place_id)
            cursor = await db.execute(
                "SELECT id FROM merchants WHERE place_id = ?", [m["place_id"]]
            )
            existing = await cursor.fetchone()
            if existing:
                continue  # Skip duplicates

            await db.execute(
                """INSERT INTO merchants (id, place_id, name, category, address, lat, lon, rating, photo_url, phone, opening_hours)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [m["id"], m["place_id"], m["name"], m["category"], m["address"],
                 m["lat"], m["lon"], m["rating"], m["photo_url"], "", "[]"]
            )
        await db.commit()
    finally:
        await db.close()


async def _generate_defaults(merchants: list):
    """Generate default AI rules and simulated transactions for new merchants."""
    import random
    from datetime import datetime, timedelta

    db = await get_db()
    try:
        for m in merchants:
            # Default rules
            category_rules = {
                "cafe": (20, "fill_quiet_hours", '["hot_drinks","pastries"]', "cozy", 40),
                "restaurant": (15, "fill_quiet_hours", '["lunch_menu","drinks"]', "professional", 60),
                "bakery": (20, "end_of_day_clearance", '["bread","pastries"]', "warm", 30),
                "bar": (15, "early_bird_special", '["drinks","snacks"]', "energetic", 50),
                "book_store": (10, "rainy_day_special", '["books","gifts"]', "cozy", 25),
            }
            r = category_rules.get(m["category"], category_rules["cafe"])

            # Check if rules already exist
            cursor = await db.execute(
                "SELECT id FROM merchant_rules WHERE merchant_id = ?", [m["id"]]
            )
            if not await cursor.fetchone():
                await db.execute(
                    """INSERT INTO merchant_rules 
                       (merchant_id, max_discount_percent, target, product_scope, brand_tone, daily_budget_eur)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    [m["id"], r[0], r[1], r[2], r[3], r[4]]
                )

            # Generate 48h of simulated transactions
            patterns = {
                "cafe": [0,0,0,0,0,0,2,8,15,12,8,6,10,8,6,5,4,3,2,1,0,0,0,0],
                "restaurant": [0,0,0,0,0,0,0,1,2,3,5,12,18,15,5,3,4,8,15,18,12,5,2,0],
                "bakery": [0,0,0,0,0,3,8,15,12,8,6,5,8,5,3,2,2,1,0,0,0,0,0,0],
                "bar": [0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,4,6,10,15,18,20,18,12,5],
                "book_store": [0,0,0,0,0,0,0,0,1,3,5,6,4,5,6,5,4,3,2,1,0,0,0,0],
            }
            pattern = patterns.get(m["category"], patterns["cafe"])
            now = datetime.now()
            amount_ranges = {
                "cafe": (2.5, 8), "restaurant": (8, 35), "bakery": (2, 12),
                "bar": (4, 20), "book_store": (5, 40),
            }
            min_a, max_a = amount_ranges.get(m["category"], (3, 15))

            for hours_ago in range(48):
                hour_time = now - timedelta(hours=hours_ago)
                base = pattern[hour_time.hour]
                count = max(0, int(base * random.uniform(0.6, 1.4)))
                for _ in range(count):
                    tx_time = hour_time + timedelta(minutes=random.randint(0, 59))
                    amount = round(random.uniform(min_a, max_a), 2)
                    await db.execute(
                        "INSERT INTO simulated_transactions (merchant_id, amount, timestamp) VALUES (?, ?, ?)",
                        [m["id"], amount, tx_time.isoformat()]
                    )

        await db.commit()
    finally:
        await db.close()


async def search_nearby(lat: float, lon: float, radius: int = 500, types: list = None) -> list:
    """
    Search for nearby merchants. Dynamic: works anywhere.
    1. Check database first
    2. If empty, fetch live from Google Places
    3. Cache for 30 minutes
    """
    cache_key = f"nearby_{round(lat, 3)}_{round(lon, 3)}_{radius}"

    # Check cache
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    # Step 1: Search database
    merchants = await _search_db(lat, lon, radius)

    # Step 2: If no merchants in DB for this area, fetch from Google
    if len(merchants) < 3:
        print(f"📍 Only {len(merchants)} merchants in DB for ({lat}, {lon}). Fetching from Google Places...")
        live_merchants = await _fetch_from_google(lat, lon, radius)
        if live_merchants:
            # Merge: DB merchants + new Google merchants (deduplicate by place_id)
            seen_place_ids = {m["place_id"] for m in merchants}
            for lm in live_merchants:
                if lm["place_id"] not in seen_place_ids:
                    merchants.append(lm)
                    seen_place_ids.add(lm["place_id"])

    # Filter by type if specified
    if types:
        merchants = [m for m in merchants if m["category"] in types]

    merchants.sort(key=lambda x: x["distance_m"])

    # Cache
    _cache[cache_key] = (time.time(), merchants)
    return merchants


async def get_merchant_by_id(merchant_id: str) -> dict:
    """Get a single merchant by ID from database."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM merchants WHERE id = ?", [merchant_id])
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        await db.close()