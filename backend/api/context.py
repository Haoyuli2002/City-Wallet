"""
Context API — returns full environmental context for a user's location.
Used by consumer app to decide whether to generate an offer.
"""

from fastapi import APIRouter, HTTPException, Query
import googlemaps
from config.settings import settings
from models.schemas import ContextRequest
from services.context_engine import build_context

router = APIRouter(tags=["Context"])


@router.get("/geocode")
async def geocode(query: str = Query(description="Place name or address, e.g. 'Marienplatz Munich'")):
    """
    Convert a place name/address to coordinates.
    Uses Google Geocoding API. Returns lat, lon, formatted address.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")
    
    try:
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        results = gmaps.geocode(query)
        
        if not results:
            raise HTTPException(status_code=404, detail=f"Location not found: {query}")
        
        location = results[0]["geometry"]["location"]
        return {
            "lat": location["lat"],
            "lon": location["lng"],
            "formatted_address": results[0].get("formatted_address", query),
            "place_id": results[0].get("place_id", ""),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")


@router.post("/context")
async def get_context(req: ContextRequest):
    """
    Get full context state: weather + time + nearby merchants + transaction density + trigger score.
    
    Frontend should call this first, then check trigger_score > 0.7 to decide if offer should be generated.
    """
    try:
        context = await build_context(
            lat=req.lat,
            lon=req.lon,
            user_intent=req.user_intent,
            confidence=req.confidence,
            zone=req.zone,
            user_id=getattr(req, 'user_id', 'anonymous'),
        )
        return context
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context error: {str(e)}")