"""
Redemption & Wallet API — QR code scanning, offer redemption, cashback wallet.
Used by merchant dashboard (redeem) and consumer app (wallet).
"""

import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict
from models.schemas import RedeemRequest
from models.database import get_db
from services.qr_service import complete_redemption

router = APIRouter(tags=["Redemption"])


# ==================== User Preferences (Cold Start) ====================

class UserPreferencesUpdate(BaseModel):
    preferences: Dict[str, float] = Field(
        description="Category preference scores, e.g. {'cafe': 1.0, 'bakery': 0.8}"
    )


@router.put("/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, req: UserPreferencesUpdate):
    """
    Set user's explicit interest preferences (cold start).
    Called when user first opens the app and selects their interests.
    Preferences: {category: score} where score 0-1.
    """
    db = await get_db()
    try:
        prefs_json = json.dumps(req.preferences)
        # Upsert
        cursor = await db.execute(
            "SELECT id FROM user_preferences WHERE user_id = ?", [user_id]
        )
        if await cursor.fetchone():
            await db.execute(
                "UPDATE user_preferences SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                [prefs_json, user_id]
            )
        else:
            await db.execute(
                "INSERT INTO user_preferences (user_id, preferences) VALUES (?, ?)",
                [user_id, prefs_json]
            )
        await db.commit()
        return {"status": "saved", "user_id": user_id, "preferences": req.preferences}
    finally:
        await db.close()


@router.get("/users/{user_id}/preferences")
async def get_user_preferences(user_id: str):
    """Get user's explicit interest preferences."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT preferences FROM user_preferences WHERE user_id = ?", [user_id]
        )
        row = await cursor.fetchone()
        if row:
            return {"user_id": user_id, "preferences": json.loads(row["preferences"])}
        return {"user_id": user_id, "preferences": {}}
    finally:
        await db.close()


@router.post("/offers/{offer_id}/redeem")
async def redeem_offer(offer_id: str, req: RedeemRequest):
    """
    Merchant scans customer's QR code to redeem an offer.
    Validates token, calculates discount, credits cashback to wallet.
    """
    result = await complete_redemption(
        token=req.token,
        transaction_amount=req.transaction_amount,
    )

    if result["status"] in ("invalid", "expired", "already_redeemed"):
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@router.get("/wallet/{user_id}")
async def get_wallet(user_id: str):
    """Get user's cashback wallet balance and transaction history."""
    db = await get_db()
    try:
        # Get balance
        cursor = await db.execute(
            "SELECT balance FROM wallet WHERE user_id = ?", [user_id]
        )
        wallet = await cursor.fetchone()
        balance = wallet["balance"] if wallet else 0.0

        # Get transaction history
        cursor = await db.execute(
            """SELECT id, type, amount, description, created_at 
               FROM wallet_transactions WHERE user_id = ? 
               ORDER BY created_at DESC LIMIT 50""",
            [user_id]
        )
        rows = await cursor.fetchall()
        transactions = [dict(row) for row in rows]

        return {
            "user_id": user_id,
            "balance": balance,
            "transactions": transactions,
        }
    finally:
        await db.close()