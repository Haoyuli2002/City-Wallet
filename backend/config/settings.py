"""Application settings loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Default city
    DEFAULT_CITY: str = os.getenv("DEFAULT_CITY", "munich")
    DEFAULT_LAT: float = float(os.getenv("DEFAULT_LAT", "48.1371"))
    DEFAULT_LON: float = float(os.getenv("DEFAULT_LON", "11.5754"))

    # Database
    DB_PATH: str = os.getenv("DB_PATH", "city_wallet.db")

    # OpenAI
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    # Google Places
    PLACES_SEARCH_RADIUS: int = int(os.getenv("PLACES_SEARCH_RADIUS", "500"))

    # Eventbrite
    EVENTBRITE_TOKEN: str = os.getenv("EVENTBRITE_TOKEN", "")

    # Frontend URL (for CORS)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")


settings = Settings()