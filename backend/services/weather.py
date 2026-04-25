"""
Weather service — fetches real-time weather from OpenWeatherMap API.
Falls back to simulated data if API key is missing or API fails.
"""

import httpx
import time
from config.settings import settings

# Simple cache: {cache_key: (timestamp, data)}
_cache = {}
CACHE_TTL = 600  # 10 minutes


def _get_weather_trigger(temp: float, condition: str) -> str:
    """Determine weather trigger label based on temperature and condition."""
    condition_lower = condition.lower()
    if condition_lower in ("rain", "drizzle", "thunderstorm"):
        return "rainy"
    if condition_lower == "snow":
        return "snowy"
    if temp < 10:
        return "cold"
    if temp > 28:
        return "hot"
    return "nice"


def _get_weather_icon(condition: str) -> str:
    """Map weather condition to emoji icon."""
    icons = {
        "clear": "☀️",
        "clouds": "☁️",
        "rain": "🌧️",
        "drizzle": "🌦️",
        "thunderstorm": "⛈️",
        "snow": "❄️",
        "mist": "🌫️",
        "fog": "🌫️",
        "haze": "🌫️",
    }
    return icons.get(condition.lower(), "🌤️")


async def get_weather(lat: float, lon: float) -> dict:
    """
    Get current weather for a location.
    Returns: {temp, feels_like, condition, description, humidity, wind_speed, icon, trigger}
    """
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"

    # Check cache
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    # Try real API
    if settings.OPENWEATHER_API_KEY and settings.OPENWEATHER_API_KEY != "your-openweathermap-api-key-here":
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": settings.OPENWEATHER_API_KEY,
                        "units": "metric",
                        "lang": "en",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    weather = data.get("weather", [{}])[0]
                    main = data.get("main", {})
                    wind = data.get("wind", {})

                    result = {
                        "temp": round(main.get("temp", 15), 1),
                        "feels_like": round(main.get("feels_like", 13), 1),
                        "condition": weather.get("main", "Clouds"),
                        "description": weather.get("description", "partly cloudy"),
                        "humidity": main.get("humidity", 50),
                        "wind_speed": round(wind.get("speed", 2.0), 1),
                        "icon": _get_weather_icon(weather.get("main", "Clouds")),
                        "trigger": _get_weather_trigger(
                            main.get("temp", 15), weather.get("main", "Clouds")
                        ),
                    }

                    # Cache the result
                    _cache[cache_key] = (time.time(), result)
                    return result
                else:
                    print(f"⚠️ OpenWeatherMap API returned {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            print(f"⚠️ OpenWeatherMap API error: {e}")

    # Fallback: simulated weather for Munich
    fallback = {
        "temp": 12.5,
        "feels_like": 9.8,
        "condition": "Clouds",
        "description": "overcast clouds",
        "humidity": 68,
        "wind_speed": 3.5,
        "icon": "☁️",
        "trigger": "cold",
    }
    _cache[cache_key] = (time.time(), fallback)
    return fallback