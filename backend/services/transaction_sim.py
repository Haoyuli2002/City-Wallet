"""
Transaction density service — reads simulated Payone transaction data from DB.
Determines how busy/quiet each merchant is right now compared to 
the past 30 days' average for the same hour.
"""

from datetime import datetime, timedelta
from models.database import get_db


async def get_current_density(merchant_id: str) -> dict:
    """
    Get current transaction density for a merchant.
    
    Logic:
    1. Count transactions in the current hour (today)
    2. Calculate the average transaction count for this same hour 
       over the past 30 days
    3. Compare: ratio = current / monthly_avg
    4. Classify: very_low (≤25%) / low (≤50%) / normal (≤120%) / busy (≤180%) / very_busy (>180%)
    
    Returns: {current_hour, avg_hour, status, demand_gap}
    """
    now = datetime.now()
    current_hour = now.hour
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    db = await get_db()
    try:
        # Step 1: Count transactions in the current hour TODAY
        today_start = now.replace(hour=current_hour, minute=0, second=0, microsecond=0).isoformat()
        today_end = now.replace(hour=current_hour, minute=59, second=59, microsecond=0).isoformat()

        cursor = await db.execute(
            """SELECT COUNT(*) as cnt FROM simulated_transactions 
               WHERE merchant_id = ? AND timestamp >= ? AND timestamp <= ?""",
            [merchant_id, today_start, today_end]
        )
        row = await cursor.fetchone()
        current_count = row["cnt"] if row else 0

        # Step 2: Get average for this SAME HOUR over the past 30 days
        # Total transactions at this hour in the past 30 days / number of days with data
        cursor = await db.execute(
            """SELECT COUNT(*) as total_tx, 
                      COUNT(DISTINCT DATE(timestamp)) as num_days
               FROM simulated_transactions 
               WHERE merchant_id = ? 
               AND timestamp >= ?
               AND CAST(strftime('%H', timestamp) AS INTEGER) = ?""",
            [merchant_id, thirty_days_ago, current_hour]
        )
        row = await cursor.fetchone()
        total_tx = row["total_tx"] if row else 0
        num_days = max(row["num_days"] if row else 1, 1)
        avg_count = round(total_tx / num_days)

        # Step 3: Calculate ratio
        if avg_count == 0:
            ratio = 0.0
        else:
            ratio = current_count / avg_count

        # Step 4: Classify status
        # ≤25% of monthly avg → very_low (merchant is much quieter than usual)
        # ≤50% → low
        # ≤120% → normal
        # ≤180% → busy
        # >180% → very_busy
        if ratio <= 0.25:
            status = "very_low"
        elif ratio <= 0.50:
            status = "low"
        elif ratio <= 1.20:
            status = "normal"
        elif ratio <= 1.80:
            status = "busy"
        else:
            status = "very_busy"

        # Demand gap: 0 = no gap (busy), 1 = max gap (empty)
        # Higher gap = merchant needs more customers
        demand_gap = round(max(0.0, min(1.0, 1.0 - ratio)), 2)

        return {
            "current_hour": current_count,
            "avg_hour": avg_count,
            "status": status,
            "demand_gap": demand_gap,
        }
    finally:
        await db.close()


async def get_hourly_pattern(merchant_id: str) -> dict:
    """
    Get 24-hour transaction pattern for a merchant (past 30 days aggregated).
    Returns: {0: avg_count, 1: avg_count, ..., 23: avg_count}
    """
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()

    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, 
                      COUNT(*) as cnt,
                      COUNT(DISTINCT DATE(timestamp)) as num_days
               FROM simulated_transactions 
               WHERE merchant_id = ? AND timestamp >= ?
               GROUP BY hour ORDER BY hour""",
            [merchant_id, thirty_days_ago]
        )
        rows = await cursor.fetchall()
        pattern = {h: 0 for h in range(24)}
        for row in rows:
            num_days = max(row["num_days"], 1)
            pattern[row["hour"]] = round(row["cnt"] / num_days)
        return pattern
    finally:
        await db.close()