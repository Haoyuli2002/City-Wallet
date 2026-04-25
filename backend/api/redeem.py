"""
Redemption & Wallet API — QR code scanning, offer redemption, cashback wallet.
Used by merchant dashboard (redeem) and consumer app (wallet).
"""

from fastapi import APIRouter, HTTPException
from models.schemas import RedeemRequest
from models.database import get_db
from services.qr_service import complete_redemption

router = APIRouter(tags=["Redemption"])


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