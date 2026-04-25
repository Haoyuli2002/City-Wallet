"""
QR Code service — generates redemption tokens and QR code images.
Handles token validation and redemption flow.
"""

import io
import base64
import secrets
from datetime import datetime
from uuid import uuid4

import qrcode
from models.database import get_db


def create_token() -> str:
    """Generate a unique redemption token."""
    year = datetime.now().year
    random_hex = secrets.token_hex(8)
    return f"CW-{year}-{random_hex}"


def generate_qr_image(token: str) -> str:
    """Generate a QR code image as base64-encoded PNG data URI."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


async def create_redemption(offer_id: str, merchant_id: str, user_id: str = "anonymous") -> dict:
    """
    Create a redemption record with QR token for an accepted offer.
    Returns: {redemption_id, token, qr_code}
    """
    token = create_token()
    qr_code = generate_qr_image(token)
    redemption_id = f"red_{uuid4().hex[:10]}"

    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO redemptions (id, offer_id, merchant_id, user_id, token, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [redemption_id, offer_id, merchant_id, user_id, token, "pending"]
        )
        await db.commit()
    finally:
        await db.close()

    return {
        "redemption_id": redemption_id,
        "token": token,
        "qr_code": qr_code,
    }


async def validate_token(token: str) -> dict:
    """
    Validate a redemption token.
    Returns redemption info if valid, None if invalid/expired/already used.
    """
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT r.*, o.discount_percent, o.merchant_id, o.headline, o.expires_at
               FROM redemptions r 
               JOIN offers o ON r.offer_id = o.id
               WHERE r.token = ?""",
            [token]
        )
        row = await cursor.fetchone()

        if not row:
            return None

        # Check if already redeemed
        if row["status"] == "completed":
            return {"error": "already_redeemed", "message": "This offer has already been redeemed"}

        # Check if expired
        if row["expires_at"]:
            expires = datetime.fromisoformat(row["expires_at"])
            if datetime.now() > expires:
                return {"error": "expired", "message": "This offer has expired"}

        return dict(row)
    finally:
        await db.close()


async def complete_redemption(token: str, transaction_amount: float) -> dict:
    """
    Complete a redemption: calculate discount, credit cashback, update all records.
    Returns: {status, discount_applied, cashback_credited, wallet_new_balance}
    """
    # Validate token first
    redemption = await validate_token(token)
    if redemption is None:
        return {"status": "invalid", "message": "Token not found"}
    if "error" in redemption:
        return {"status": redemption["error"], "message": redemption["message"]}

    discount_percent = redemption["discount_percent"]
    discount_amount = round(transaction_amount * discount_percent / 100, 2)
    cashback_amount = discount_amount  # Cashback = discount amount
    offer_id = redemption["offer_id"]
    merchant_id = redemption["merchant_id"]
    user_id = redemption.get("user_id", "anonymous")
    now = datetime.now().isoformat()

    db = await get_db()
    try:
        # 1. Update redemption record
        await db.execute(
            """UPDATE redemptions SET status = 'completed', 
               transaction_amount = ?, discount_amount = ?, cashback_amount = ?,
               completed_at = ? WHERE token = ?""",
            [transaction_amount, discount_amount, cashback_amount, now, token]
        )

        # 2. Update offer status
        await db.execute(
            "UPDATE offers SET status = 'redeemed', redeemed_at = ? WHERE id = ?",
            [now, offer_id]
        )

        # 3. Update merchant budget spent
        await db.execute(
            """UPDATE merchant_rules SET budget_spent_today = budget_spent_today + ? 
               WHERE merchant_id = ?""",
            [discount_amount, merchant_id]
        )

        # 4. Credit cashback to wallet
        # Ensure wallet exists
        cursor = await db.execute(
            "SELECT balance FROM wallet WHERE user_id = ?", [user_id]
        )
        wallet = await cursor.fetchone()
        if wallet:
            new_balance = round(wallet["balance"] + cashback_amount, 2)
            await db.execute(
                "UPDATE wallet SET balance = ?, updated_at = ? WHERE user_id = ?",
                [new_balance, now, user_id]
            )
        else:
            new_balance = cashback_amount
            await db.execute(
                "INSERT INTO wallet (user_id, balance, updated_at) VALUES (?, ?, ?)",
                [user_id, new_balance, now]
            )

        # 5. Record wallet transaction
        await db.execute(
            """INSERT INTO wallet_transactions (user_id, type, amount, description, offer_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [user_id, "cashback", cashback_amount,
             f"{discount_percent}% cashback ({redemption.get('headline', 'offer')})",
             offer_id, now]
        )

        await db.commit()

        return {
            "status": "redeemed",
            "offer_id": offer_id,
            "discount_applied": discount_amount,
            "cashback_credited": cashback_amount,
            "wallet_new_balance": new_balance,
            "message": f"€{cashback_amount} cashback added to your wallet!",
        }
    finally:
        await db.close()