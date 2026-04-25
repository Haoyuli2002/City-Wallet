"""
Google Places service — searches nearby merchants and gets details.
Falls back to database merchants if API key is missing.
"""

import math
import time
import googlemaps
from config.settings import settings
from models.database import get_db

# Cache
_cache = {}
CACHE_TTL = 1800  # 30 minutes


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


async def search_nearby_from_db(lat: float, lon: float, radius: int = 500) -> list:
    """Get nearby merchants from our seeded database (always available)."""
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


async def search_nearby(lat: float, lon: float, radius: int = 500, types: list = None) -> list:
    """
    Search for nearby merchants. Uses database (seeded from Google Places).
    Returns list of merchants sorted by distance.
    """
    cache_key = f"nearby_{round(lat, 3)}_{round(lon, 3)}_{radius}"

    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    # Use database merchants (already seeded from Google Places)
    merchants = await search_nearby_from_db(lat, lon, radius)

    # Filter by type if specified
    if types:
        merchants = [m for m in merchants if m["category"] in types]

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