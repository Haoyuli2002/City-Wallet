"""
Context API — returns full environmental context for a user's location.
Used by consumer app to decide whether to generate an offer.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import ContextRequest
from services.context_engine import build_context

router = APIRouter(tags=["Context"])


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