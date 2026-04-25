"""
Merchants API — list, details, rules management, analytics, live feed.
Used by merchant dashboard.
"""

import json
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from models.schemas import MerchantRulesUpdate
from models.database import get_db
from services.transaction_sim import get_hourly_pattern

router = APIRouter(tags=["Merchants"])


@router.get("/merchants")
async def list_merchants():
    """List all merchants (for login/selection screen)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, category, address, rating, photo_url FROM merchants ORDER BY name"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


@router.get("/merchants/{merchant_id}")
async def get_merchant(merchant_id: str):
    """Get merchant details including current AI rules."""
    db = await get_db()
    try:
        # Merchant info
        cursor = await db.execute("SELECT * FROM merchants WHERE id = ?", [merchant_id])
        merchant = await cursor.fetchone()
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant not found")

        # Rules
        cursor = await db.execute(
            "SELECT * FROM merchant_rules WHERE merchant_id = ?", [merchant_id]
        )
        rules = await cursor.fetchone()

        result = {
            "merchant": dict(merchant),
            "rules": dict(rules) if rules else None,
        }

        # Parse product_scope from JSON string
        if result["rules"] and isinstance(result["rules"].get("product_scope"), str):
            try:
                result["rules"]["product_scope"] = json.loads(result["rules"]["product_scope"])
            except:
                pass

        return result
    finally:
        await db.close()


@router.put("/merchants/{merchant_id}/rules")
async def update_rules(merchant_id: str, update: MerchantRulesUpdate):
    """Update AI rules for a merchant. Only send fields you want to change."""
    db = await get_db()
    try:
        # Check merchant exists
        cursor = await db.execute("SELECT id FROM merchants WHERE id = ?", [merchant_id])
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Merchant not found")

        # Build update query dynamically
        updates = []
        values = []
        update_dict = update.model_dump(exclude_none=True)

        if "max_discount_percent" in update_dict:
            updates.append("max_discount_percent = ?")
            values.append(update_dict["max_discount_percent"])
        if "target" in update_dict:
            updates.append("target = ?")
            values.append(update_dict["target"])
        if "product_scope" in update_dict:
            updates.append("product_scope = ?")
            values.append(json.dumps(update_dict["product_scope"]))
        if "brand_tone" in update_dict:
            updates.append("brand_tone = ?")
            values.append(update_dict["brand_tone"])
        if "daily_budget_eur" in update_dict:
            updates.append("daily_budget_eur = ?")
            values.append(update_dict["daily_budget_eur"])
        if "active_hours_start" in update_dict:
            updates.append("active_hours_start = ?")
            values.append(update_dict["active_hours_start"])
        if "active_hours_end" in update_dict:
            updates.append("active_hours_end = ?")
            values.append(update_dict["active_hours_end"])
        if "is_active" in update_dict:
            updates.append("is_active = ?")
            values.append(update_dict["is_active"])

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = ?")
        values.append(datetime.now().isoformat())
        values.append(merchant_id)

        await db.execute(
            f"UPDATE merchant_rules SET {', '.join(updates)} WHERE merchant_id = ?",
            values
        )
        await db.commit()

        # Return updated rules
        cursor = await db.execute(
            "SELECT * FROM merchant_rules WHERE merchant_id = ?", [merchant_id]
        )
        rules = await cursor.fetchone()
        rules_dict = dict(rules)
        if isinstance(rules_dict.get("product_scope"), str):
            try:
                rules_dict["product_scope"] = json.loads(rules_dict["product_scope"])
            except:
                pass

        return {"status": "updated", "rules": rules_dict}
    finally:
        await db.close()


@router.get("/merchants/{merchant_id}/analytics")
async def get_analytics(merchant_id: str, period: str = "today"):
    """Get merchant performance analytics: funnel, rates, revenue."""
    db = await get_db()
    try:
        # Check merchant exists
        cursor = await db.execute("SELECT name FROM merchants WHERE id = ?", [merchant_id])
        merchant = await cursor.fetchone()
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant not found")

        # Get offer funnel counts
        cursor = await db.execute(
            "SELECT status, COUNT(*) as cnt FROM offers WHERE merchant_id = ? GROUP BY status",
            [merchant_id]
        )
        status_counts = {row["status"]: row["cnt"] for row in await cursor.fetchall()}

        generated = status_counts.get("generated", 0) + status_counts.get("displayed", 0) + \
                    status_counts.get("accepted", 0) + status_counts.get("redeemed", 0) + \
                    status_counts.get("dismissed", 0) + status_counts.get("expired", 0)
        displayed = generated - status_counts.get("generated", 0)  # approximation
        accepted = status_counts.get("accepted", 0) + status_counts.get("redeemed", 0)
        redeemed = status_counts.get("redeemed", 0)
        dismissed = status_counts.get("dismissed", 0)
        expired = status_counts.get("expired", 0)

        # If no real offers yet, show simulated data
        if generated == 0:
            generated = random.randint(20, 35)
            displayed = int(generated * random.uniform(0.65, 0.85))
            accepted = int(displayed * random.uniform(0.25, 0.45))
            dismissed = int(displayed * random.uniform(0.15, 0.30))
            expired = max(0, displayed - accepted - dismissed)
            redeemed = int(accepted * random.uniform(0.55, 0.85))

        # Rates
        acceptance_rate = round(accepted / max(displayed, 1), 2)
        redemption_rate = round(redeemed / max(accepted, 1), 2)
        conversion_rate = round(redeemed / max(generated, 1), 2)

        # Revenue from redemptions
        cursor = await db.execute(
            """SELECT COALESCE(SUM(transaction_amount), 0) as total_tx,
                      COALESCE(SUM(discount_amount), 0) as total_disc
               FROM redemptions WHERE merchant_id = ? AND status = 'completed'""",
            [merchant_id]
        )
        rev = await cursor.fetchone()
        total_tx_value = rev["total_tx"] if rev else 0
        total_discount = rev["total_disc"] if rev else 0

        # If no real redemptions, simulate
        if total_tx_value == 0 and redeemed > 0:
            total_tx_value = round(redeemed * random.uniform(4, 15), 2)
            total_discount = round(total_tx_value * 0.12, 2)

        incremental = round(total_tx_value - total_discount, 2)
        cpa = round(total_discount / max(redeemed, 1), 2)
        roi = round((incremental / max(total_discount, 0.01)) * 100, 0)

        # Hourly pattern
        hourly = await get_hourly_pattern(merchant_id)

        return {
            "merchant_id": merchant_id,
            "merchant_name": merchant["name"],
            "period": period,
            "funnel": {
                "generated": generated,
                "displayed": displayed,
                "accepted": accepted,
                "redeemed": redeemed,
                "dismissed": dismissed,
                "expired": expired,
            },
            "rates": {
                "acceptance_rate": acceptance_rate,
                "redemption_rate": redemption_rate,
                "conversion_rate": conversion_rate,
            },
            "revenue": {
                "total_transaction_value": total_tx_value,
                "total_discount_given": total_discount,
                "estimated_incremental_revenue": incremental,
                "cost_per_acquisition": cpa,
                "roi_percent": roi,
            },
            "hourly_pattern": hourly,
        }
    finally:
        await db.close()


@router.get("/merchants/{merchant_id}/feed")
async def get_feed(merchant_id: str, limit: int = 20):
    """Get live event feed for a merchant."""
    db = await get_db()
    try:
        # Get recent offers as events
        cursor = await db.execute(
            """SELECT id, headline, status, created_at, accepted_at, redeemed_at, dismissed_at
               FROM offers WHERE merchant_id = ? 
               ORDER BY created_at DESC LIMIT ?""",
            [merchant_id, limit * 2]
        )
        rows = await cursor.fetchall()

        events = []
        icon_map = {
            "generated": ("🤖", "AI Generated"),
            "displayed": ("👁️", "Displayed to user"),
            "accepted": ("✅", "Accepted"),
            "redeemed": ("📱", "QR Redeemed"),
            "dismissed": ("❌", "Dismissed"),
            "expired": ("⏰", "Expired"),
        }

        for row in rows:
            status = row["status"]
            icon, label = icon_map.get(status, ("📋", status))
            timestamp = row.get(f"{status}_at") or row["created_at"]
            if timestamp and "T" in timestamp:
                timestamp = timestamp.split("T")[1][:5]

            message = f"{label}: {row['headline']}" if row["headline"] else label

            # Add redemption details if redeemed
            if status == "redeemed":
                cursor2 = await db.execute(
                    "SELECT transaction_amount, discount_amount FROM redemptions WHERE offer_id = ?",
                    [row["id"]]
                )
                red = await cursor2.fetchone()
                if red:
                    message += f" · €{red['transaction_amount']} · -€{red['discount_amount']} discount"

            events.append({
                "timestamp": timestamp or "",
                "event_type": f"offer_{status}",
                "icon": icon,
                "message": message,
            })

        # If no real events, generate simulated ones
        if not events:
            now = datetime.now()
            headlines = ["Cold outside? ☕", "Lunch special 🍽️", "Fresh pastry 🥖", "Happy hour 🍺"]
            statuses = [
                ("offer_generated", "🤖", "AI Generated"),
                ("offer_accepted", "✅", "Accepted"),
                ("offer_redeemed", "📱", "QR Redeemed"),
                ("offer_dismissed", "❌", "Dismissed"),
                ("offer_expired", "⏰", "Expired"),
            ]
            for i in range(min(limit, 15)):
                mins_ago = random.randint(5, 480)
                t = (now - timedelta(minutes=mins_ago)).strftime("%H:%M")
                s = random.choice(statuses)
                h = random.choice(headlines)
                msg = f"{s[2]}: {h}"
                if s[0] == "offer_redeemed":
                    amt = round(random.uniform(3, 20), 2)
                    disc = round(amt * 0.15, 2)
                    msg += f" · €{amt} · -€{disc} discount"
                events.append({
                    "timestamp": t,
                    "event_type": s[0],
                    "icon": s[1],
                    "message": msg,
                })
            events.sort(key=lambda e: e["timestamp"], reverse=True)

        return {
            "merchant_id": merchant_id,
            "events": events[:limit],
        }
    finally:
        await db.close()