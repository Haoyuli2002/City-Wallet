"""
City Wallet — Seed Database
Fetches real merchant data from Google Places API (Munich/Marienplatz area)
Falls back to hardcoded data if no API key is available.
Also generates simulated Payone transaction data and a demo wallet.
"""

import asyncio
import json
import os
import random
import sys
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.database import init_db, get_db
from config.settings import settings


# ==================== Google Places Fetch ====================

async def fetch_merchants_from_google(lat: float, lon: float, radius: int = 500):
    """Fetch real merchants from Google Places API."""
    import googlemaps

    if not settings.GOOGLE_MAPS_API_KEY:
        print("⚠️  No Google Maps API key found. Using fallback data.")
        return None

    try:
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
        merchants = []
        
        search_types = ["cafe", "restaurant", "bakery", "bar", "book_store"]
        
        for place_type in search_types:
            print(f"  🔍 Searching for {place_type}s near ({lat}, {lon})...")
            results = gmaps.places_nearby(
                location=(lat, lon),
                radius=radius,
                type=place_type,
                language="en"
            )
            
            for place in results.get("results", [])[:5]:  # Max 5 per type
                # Get photo URL if available
                photo_url = None
                if place.get("photos"):
                    photo_ref = place["photos"][0].get("photo_reference")
                    if photo_ref:
                        photo_url = (
                            f"https://maps.googleapis.com/maps/api/place/photo"
                            f"?maxwidth=400&photo_reference={photo_ref}"
                            f"&key={settings.GOOGLE_MAPS_API_KEY}"
                        )

                merchant = {
                    "id": f"m_{uuid4().hex[:8]}",
                    "place_id": place.get("place_id", ""),
                    "name": place.get("name", "Unknown"),
                    "category": place_type,
                    "address": place.get("vicinity", ""),
                    "lat": place["geometry"]["location"]["lat"],
                    "lon": place["geometry"]["location"]["lng"],
                    "rating": place.get("rating", 0),
                    "photo_url": photo_url,
                    "phone": "",
                    "opening_hours": json.dumps(
                        place.get("opening_hours", {}).get("weekday_text", [])
                    ),
                }
                merchants.append(merchant)
        
        print(f"  ✅ Found {len(merchants)} merchants from Google Places")
        return merchants

    except Exception as e:
        print(f"  ❌ Google Places API error: {e}")
        print("  ⚠️  Falling back to hardcoded data.")
        return None


# ==================== Fallback Data ====================

def get_fallback_merchants():
    """Hardcoded Munich merchants for when Google API is unavailable."""
    return [
        {
            "id": "m_cafe001",
            "place_id": "fallback_001",
            "name": "Café Frischhut",
            "category": "cafe",
            "address": "Prälat-Zistl-Straße 8, Munich",
            "lat": 48.1358, "lon": 11.5766,
            "rating": 4.5, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_cafe002",
            "place_id": "fallback_002",
            "name": "Café Luitpold",
            "category": "cafe",
            "address": "Brienner Str. 11, Munich",
            "lat": 48.1425, "lon": 11.5720,
            "rating": 4.3, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_rest001",
            "place_id": "fallback_003",
            "name": "Augustiner am Dom",
            "category": "restaurant",
            "address": "Frauenplatz 8, Munich",
            "lat": 48.1385, "lon": 11.5735,
            "rating": 4.2, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_rest002",
            "place_id": "fallback_004",
            "name": "Ratskeller München",
            "category": "restaurant",
            "address": "Marienplatz 8, Munich",
            "lat": 48.1372, "lon": 11.5756,
            "rating": 4.0, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_bake001",
            "place_id": "fallback_005",
            "name": "Rischart am Marienplatz",
            "category": "bakery",
            "address": "Marienplatz 18, Munich",
            "lat": 48.1368, "lon": 11.5760,
            "rating": 4.4, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_bar001",
            "place_id": "fallback_006",
            "name": "Hofbräuhaus München",
            "category": "bar",
            "address": "Platzl 9, Munich",
            "lat": 48.1376, "lon": 11.5799,
            "rating": 4.3, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_book001",
            "place_id": "fallback_007",
            "name": "Hugendubel am Marienplatz",
            "category": "book_store",
            "address": "Marienplatz 22, Munich",
            "lat": 48.1374, "lon": 11.5748,
            "rating": 4.1, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_cafe003",
            "place_id": "fallback_008",
            "name": "Man versus Machine Coffee",
            "category": "cafe",
            "address": "Müllerstraße 23, Munich",
            "lat": 48.1320, "lon": 11.5690,
            "rating": 4.6, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_rest003",
            "place_id": "fallback_009",
            "name": "Wirtshaus in der Au",
            "category": "restaurant",
            "address": "Lilienstraße 51, Munich",
            "lat": 48.1268, "lon": 11.5850,
            "rating": 4.4, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
        {
            "id": "m_bake002",
            "place_id": "fallback_010",
            "name": "Bäckerei Zöttl",
            "category": "bakery",
            "address": "Tal 40, Munich",
            "lat": 48.1360, "lon": 11.5790,
            "rating": 4.3, "photo_url": None, "phone": "",
            "opening_hours": "[]",
        },
    ]


# ==================== Default Rules ====================

def get_default_rules(merchant_id: str, category: str) -> dict:
    """Generate sensible default AI rules based on merchant category."""
    category_rules = {
        "cafe": {
            "max_discount_percent": 20,
            "target": "fill_quiet_hours",
            "product_scope": json.dumps(["hot_drinks", "pastries", "cold_drinks"]),
            "brand_tone": "cozy",
            "daily_budget_eur": 40.0,
        },
        "restaurant": {
            "max_discount_percent": 15,
            "target": "fill_quiet_hours",
            "product_scope": json.dumps(["lunch_menu", "drinks", "appetizers"]),
            "brand_tone": "professional",
            "daily_budget_eur": 60.0,
        },
        "bakery": {
            "max_discount_percent": 20,
            "target": "end_of_day_clearance",
            "product_scope": json.dumps(["bread", "pastries", "cakes"]),
            "brand_tone": "warm",
            "daily_budget_eur": 30.0,
        },
        "bar": {
            "max_discount_percent": 15,
            "target": "early_bird_special",
            "product_scope": json.dumps(["drinks", "snacks"]),
            "brand_tone": "energetic",
            "daily_budget_eur": 50.0,
        },
        "book_store": {
            "max_discount_percent": 10,
            "target": "rainy_day_special",
            "product_scope": json.dumps(["books", "stationery", "gifts"]),
            "brand_tone": "cozy",
            "daily_budget_eur": 25.0,
        },
    }

    rules = category_rules.get(category, category_rules["cafe"])
    return {
        "merchant_id": merchant_id,
        **rules,
        "budget_spent_today": 0.0,
        "active_hours_start": None,
        "active_hours_end": None,
        "is_active": True,
    }


# ==================== Simulated Transactions ====================

def generate_simulated_transactions(merchant_id: str, category: str, hours: int = 48):
    """Generate realistic Payone transaction data for a merchant."""
    
    # Hourly transaction patterns (avg transactions per hour)
    # Index 0 = midnight, index 12 = noon, etc.
    patterns = {
        "cafe": [0, 0, 0, 0, 0, 0, 2, 8, 15, 12, 8, 6, 10, 8, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0],
        "restaurant": [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 5, 12, 18, 15, 5, 3, 4, 8, 15, 18, 12, 5, 2, 0],
        "bakery": [0, 0, 0, 0, 0, 3, 8, 15, 12, 8, 6, 5, 8, 5, 3, 2, 2, 1, 0, 0, 0, 0, 0, 0],
        "bar": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 3, 4, 6, 10, 15, 18, 20, 18, 12, 5],
        "book_store": [0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 4, 5, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0],
    }
    
    pattern = patterns.get(category, patterns["cafe"])
    transactions = []
    now = datetime.now()
    start_time = now - timedelta(hours=hours)
    
    current_hour = start_time.replace(minute=0, second=0, microsecond=0)
    
    while current_hour < now:
        hour_of_day = current_hour.hour
        base_count = pattern[hour_of_day]
        
        # Weekend boost for restaurants and bars
        is_weekend = current_hour.weekday() >= 5
        if is_weekend and category in ["restaurant", "bar"]:
            base_count = int(base_count * 1.4)
        elif is_weekend and category in ["cafe", "bakery"]:
            base_count = int(base_count * 1.2)
        
        # Random variation ±40%
        actual_count = max(0, int(base_count * random.uniform(0.6, 1.4)))
        
        # Generate individual transactions within this hour
        for _ in range(actual_count):
            # Random minute within the hour
            minute = random.randint(0, 59)
            tx_time = current_hour + timedelta(minutes=minute)
            
            # Random transaction amount based on category
            amount_ranges = {
                "cafe": (2.50, 8.00),
                "restaurant": (8.00, 35.00),
                "bakery": (2.00, 12.00),
                "bar": (4.00, 20.00),
                "book_store": (5.00, 40.00),
            }
            min_amt, max_amt = amount_ranges.get(category, (3.00, 15.00))
            amount = round(random.uniform(min_amt, max_amt), 2)
            
            transactions.append({
                "merchant_id": merchant_id,
                "amount": amount,
                "timestamp": tx_time.isoformat(),
            })
        
        current_hour += timedelta(hours=1)
    
    return transactions


# ==================== Main Seed Function ====================

async def seed():
    """Main seed function: populate database with merchants, rules, and transactions."""
    
    print("🌱 Starting City Wallet database seed...")
    print(f"   City: {settings.DEFAULT_CITY}")
    print(f"   Center: ({settings.DEFAULT_LAT}, {settings.DEFAULT_LON})")
    print()

    # Step 1: Initialize database tables
    await init_db()
    print()

    # Step 2: Fetch merchants
    print("📍 Fetching merchants...")
    merchants = await fetch_merchants_from_google(
        settings.DEFAULT_LAT,
        settings.DEFAULT_LON,
        settings.PLACES_SEARCH_RADIUS
    )
    
    if merchants is None:
        print("   Using fallback merchant data...")
        merchants = get_fallback_merchants()
    
    print(f"   Total merchants: {len(merchants)}")
    print()

    # Step 3: Insert into database
    db = await get_db()
    try:
        # Clear existing data
        print("🗑️  Clearing existing data...")
        await db.execute("DELETE FROM wallet_transactions")
        await db.execute("DELETE FROM wallet")
        await db.execute("DELETE FROM redemptions")
        await db.execute("DELETE FROM offers")
        await db.execute("DELETE FROM simulated_transactions")
        await db.execute("DELETE FROM merchant_rules")
        await db.execute("DELETE FROM merchants")
        await db.commit()

        # Insert merchants
        print("🏪 Inserting merchants...")
        for m in merchants:
            await db.execute(
                """INSERT INTO merchants (id, place_id, name, category, address, lat, lon, rating, photo_url, phone, opening_hours)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [m["id"], m["place_id"], m["name"], m["category"], m["address"],
                 m["lat"], m["lon"], m["rating"], m["photo_url"], m["phone"],
                 m["opening_hours"]]
            )
            print(f"   ✅ {m['name']} ({m['category']}) — ★{m['rating']}")
        await db.commit()
        print()

        # Insert default rules for each merchant
        print("📋 Setting default AI rules...")
        for m in merchants:
            rules = get_default_rules(m["id"], m["category"])
            await db.execute(
                """INSERT INTO merchant_rules 
                   (merchant_id, max_discount_percent, target, product_scope, brand_tone, 
                    daily_budget_eur, budget_spent_today, active_hours_start, active_hours_end, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [rules["merchant_id"], rules["max_discount_percent"], rules["target"],
                 rules["product_scope"], rules["brand_tone"], rules["daily_budget_eur"],
                 rules["budget_spent_today"], rules["active_hours_start"],
                 rules["active_hours_end"], rules["is_active"]]
            )
        await db.commit()
        print(f"   ✅ Rules set for {len(merchants)} merchants")
        print()

        # Generate simulated Payone transactions
        print("📊 Generating simulated Payone transactions (48 hours)...")
        total_tx = 0
        for m in merchants:
            txs = generate_simulated_transactions(m["id"], m["category"], hours=48)
            for tx in txs:
                await db.execute(
                    "INSERT INTO simulated_transactions (merchant_id, amount, timestamp) VALUES (?, ?, ?)",
                    [tx["merchant_id"], tx["amount"], tx["timestamp"]]
                )
            total_tx += len(txs)
        await db.commit()
        print(f"   ✅ Generated {total_tx} simulated transactions")
        print()

        # Create demo user wallet
        print("💰 Creating demo wallet...")
        demo_user_id = "user_demo_001"
        await db.execute(
            "INSERT INTO wallet (user_id, balance) VALUES (?, ?)",
            [demo_user_id, 2.56]
        )
        # Add some history
        await db.execute(
            """INSERT INTO wallet_transactions (user_id, type, amount, description, created_at) 
               VALUES (?, ?, ?, ?, ?)""",
            [demo_user_id, "cashback", 1.20, "15% cashback at Café Frischhut",
             (datetime.now() - timedelta(days=2)).isoformat()]
        )
        await db.execute(
            """INSERT INTO wallet_transactions (user_id, type, amount, description, created_at) 
               VALUES (?, ?, ?, ?, ?)""",
            [demo_user_id, "cashback", 1.36, "10% cashback at Rischart",
             (datetime.now() - timedelta(days=1)).isoformat()]
        )
        await db.commit()
        print(f"   ✅ Demo wallet created for {demo_user_id} (balance: €2.56)")
        print()

        # Summary
        print("=" * 50)
        print("🎉 Seed complete!")
        print(f"   🏪 Merchants: {len(merchants)}")
        print(f"   📋 Rules: {len(merchants)}")
        print(f"   📊 Transactions: {total_tx}")
        print(f"   💰 Demo wallet: €2.56")
        print("=" * 50)

    finally:
        await db.close()


# ==================== Entry Point ====================

if __name__ == "__main__":
    asyncio.run(seed())
