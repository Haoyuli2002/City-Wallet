"""
Offers API — generate, accept, dismiss offers.
Core GenUI endpoint: AI generates personalized offers dynamically.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import OfferGenerateRequest
from models.database import get_db

def _ensure_utc(ts: str) -> str:
    """Ensure ISO timestamp ends with Z for proper browser parsing."""
    if ts and not ts.endswith('Z'):
        return ts + 'Z'
    return ts or ''

from services.context_engine import build_context
from services.ai_generator import generate_offer, get_merchant_rules
from services.qr_service import create_redemption

router = APIRouter(tags=["Offers"])


@router.post("/offers/generate")
async def generate_new_offer(req: OfferGenerateRequest):
    """
    AI generates a personalized offer based on context + merchant rules.
    This is the core GenUI endpoint — response contains all data needed to render the offer card.
    """
    try:
        # Build context
        context = await build_context(
            lat=req.lat, lon=req.lon,
            user_intent=req.user_intent,
            confidence=req.confidence,
            zone=req.zone,
        )
        context["user_id"] = req.user_id

        # Select merchant
        merchants = context.get("nearby_merchants", [])
        if not merchants:
            raise HTTPException(status_code=400, detail="No merchants nearby")

        if req.merchant_id:
            merchant = next((m for m in merchants if m["id"] == req.merchant_id), None)
            if not merchant:
                # Try from all DB merchants
                from services.places import get_merchant_by_id
                merchant = await get_merchant_by_id(req.merchant_id)
                if not merchant:
                    raise HTTPException(status_code=404, detail="Merchant not found")
        else:
            # Auto-select: merchant with highest demand gap
            merchant = merchants[0]

        # Get rules
        rules = await get_merchant_rules(merchant["id"])

        # Check if merchant is active and has budget
        if not rules.get("is_active", True):
            raise HTTPException(status_code=400, detail="Merchant has paused offers")
        
        budget_remaining = rules.get("daily_budget_eur", 50) - rules.get("budget_spent_today", 0)
        if budget_remaining <= 0:
            raise HTTPException(status_code=400, detail="Merchant daily budget exhausted")

        # Generate offer via AI
        offer = await generate_offer(context, merchant, rules)
        return offer

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Offer generation error: {str(e)}")


@router.get("/offers/{offer_id}")
async def get_offer(offer_id: str):
    """Get offer details by ID."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", [offer_id])
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Offer not found")

        offer = dict(row)

        # Get merchant info
        cursor = await db.execute("SELECT * FROM merchants WHERE id = ?", [offer["merchant_id"]])
        merchant_row = await cursor.fetchone()
        merchant = dict(merchant_row) if merchant_row else {}

        # Check if accepted — include QR data
        qr_code = None
        token = None
        if offer["status"] == "accepted":
            cursor = await db.execute(
                "SELECT token FROM redemptions WHERE offer_id = ?", [offer_id]
            )
            red_row = await cursor.fetchone()
            if red_row:
                token = red_row["token"]
                from services.qr_service import generate_qr_image
                qr_code = generate_qr_image(token)

        return {
            "id": offer["id"],
            "merchant": {
                "id": merchant.get("id", ""),
                "name": merchant.get("name", ""),
                "category": merchant.get("category", ""),
                "rating": merchant.get("rating", 0),
                "photo_url": merchant.get("photo_url"),
            },
            "content": {
                "headline": offer["headline"],
                "subtext": offer["subtext"],
                "discount_percent": offer["discount_percent"],
                "original_item": offer["original_item"],
                "cta_text": offer["cta_text"],
                "mood": offer["mood"],
                "color_primary": offer["color_primary"],
                "color_background": offer["color_background"],
                "color_accent": offer["color_accent"],
                "icon": offer["icon"],
                "valid_minutes": offer["valid_minutes"],
                "reasoning": offer["reasoning"],
            },
            "status": offer["status"],
            "created_at": _ensure_utc(offer["created_at"]),
            "expires_at": _ensure_utc(offer["expires_at"]),
            "qr_code": qr_code,
            "token": token,
        }
    finally:
        await db.close()


@router.post("/offers/{offer_id}/accept")
async def accept_offer(offer_id: str):
    """
    User accepts an offer. Generates QR code and redemption token.
    """
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", [offer_id])
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Offer not found")

        offer = dict(row)

        # Check status
        if offer["status"] not in ("generated", "displayed"):
            raise HTTPException(status_code=400, detail=f"Offer cannot be accepted (status: {offer['status']})")

        # Check expiry
        if offer["expires_at"]:
            expires = datetime.fromisoformat(offer["expires_at"])
            if datetime.now() > expires:
                await db.execute("UPDATE offers SET status = 'expired' WHERE id = ?", [offer_id])
                await db.commit()
                raise HTTPException(status_code=400, detail="Offer has expired")

        # Update status
        now = datetime.now().isoformat()
        await db.execute(
            "UPDATE offers SET status = 'accepted', accepted_at = ? WHERE id = ?",
            [now, offer_id]
        )
        await db.commit()
    finally:
        await db.close()

    # Create redemption with QR code
    redemption = await create_redemption(
        offer_id=offer_id,
        merchant_id=offer["merchant_id"],
        user_id=offer.get("user_id", "anonymous"),
    )

    # Return full offer with QR
    return await get_offer(offer_id)


@router.post("/offers/{offer_id}/dismiss")
async def dismiss_offer(offer_id: str):
    """User dismisses/swipes away an offer."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT status FROM offers WHERE id = ?", [offer_id])
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Offer not found")

        now = datetime.now().isoformat()
        await db.execute(
            "UPDATE offers SET status = 'dismissed', dismissed_at = ? WHERE id = ?",
            [now, offer_id]
        )
        await db.commit()

        return {"status": "dismissed", "message": "Not your vibe? Got it."}
    finally:
        await db.close()