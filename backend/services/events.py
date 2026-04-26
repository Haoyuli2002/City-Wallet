"""
Local events service — fetches nearby events from Eventbrite API.
Provides event context for offer generation (e.g. festival → more foot traffic).
"""

import httpx
import time
from config.settings import settings

# Cache: {cache_key: (timestamp, data)}
_cache = {}
CACHE_TTL = 3600  # 1 hour (events don't change often)


async def get_nearby_events(lat: float, lon: float, radius_km: int = 10) -> list:
    """
    Fetch upcoming events near a location from Eventbrite.
    Returns list of events with name, date, category, venue.
    """
    cache_key = f"events_{round(lat, 2)}_{round(lon, 2)}"

    # Check cache
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    if not settings.EVENTBRITE_TOKEN:
        print("⚠️ No Eventbrite token — returning empty events")
        return []

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://www.eventbriteapi.com/v3/events/search/",
                params={
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "location.within": f"{radius_km}km",
                    "sort_by": "date",
                    "expand": "venue,category",
                },
                headers={
                    "Authorization": f"Bearer {settings.EVENTBRITE_TOKEN}",
                },
            )

            if resp.status_code == 200:
                data = resp.json()
                events = []

                for event in data.get("events", [])[:10]:  # Max 10 events
                    venue = event.get("venue", {})
                    category = event.get("category", {})

                    events.append({
                        "name": event.get("name", {}).get("text", "Unknown Event"),
                        "description": (event.get("description", {}).get("text", "") or "")[:200],
                        "start": event.get("start", {}).get("local", ""),
                        "end": event.get("end", {}).get("local", ""),
                        "url": event.get("url", ""),
                        "is_free": event.get("is_free", False),
                        "category": category.get("name", "General") if category else "General",
                        "venue_name": venue.get("name", "") if venue else "",
                        "venue_address": venue.get("address", {}).get("localized_address_display", "") if venue else "",
                    })

                _cache[cache_key] = (time.time(), events)
                print(f"✅ Found {len(events)} events near ({lat}, {lon}) from Eventbrite")
                return events

            else:
                print(f"⚠️ Eventbrite API returned {resp.status_code}: {resp.text[:200]}")
                return []

    except Exception as e:
        print(f"⚠️ Eventbrite API error: {e}")
        return []