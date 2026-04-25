"""
Generate Merchant Dashboard HTML prototype.
Each merchant sees only their own data.
Run: python generate_merchant_dashboard.py
"""

import asyncio
import json
import os
import sys
import random
import webbrowser
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from models.database import get_db
from config.settings import settings

CATEGORY_ICONS = {
    "cafe": "☕", "restaurant": "🍽️", "bakery": "🥖",
    "bar": "🍺", "book_store": "📚"
}
CATEGORY_COLORS = {
    "cafe": "#8B4513", "restaurant": "#E74C3C", "bakery": "#F39C12",
    "bar": "#9B59B6", "book_store": "#3498DB"
}


async def get_all_data():
    db = await get_db()
    try:
        # Merchants
        cur = await db.execute("SELECT * FROM merchants ORDER BY name")
        merchants = [dict(r) for r in await cur.fetchall()]

        # Rules
        cur = await db.execute("SELECT * FROM merchant_rules")
        rules = {r["merchant_id"]: dict(r) for r in await cur.fetchall()}

        # Transaction counts per merchant per hour
        cur = await db.execute("""
            SELECT merchant_id, 
                   CAST(strftime('%H', timestamp) AS INTEGER) as hour,
                   COUNT(*) as cnt,
                   ROUND(SUM(amount), 2) as total_amount
            FROM simulated_transactions 
            GROUP BY merchant_id, hour 
            ORDER BY merchant_id, hour
        """)
        tx_hourly = {}
        for r in await cur.fetchall():
            mid = r["merchant_id"]
            if mid not in tx_hourly:
                tx_hourly[mid] = {}
            tx_hourly[mid][r["hour"]] = {"count": r["cnt"], "amount": r["total_amount"]}

        # Total tx per merchant
        cur = await db.execute("""
            SELECT merchant_id, COUNT(*) as cnt, ROUND(SUM(amount), 2) as total
            FROM simulated_transactions GROUP BY merchant_id
        """)
        tx_totals = {r["merchant_id"]: {"count": r["cnt"], "total": r["total"]} for r in await cur.fetchall()}

        return merchants, rules, tx_hourly, tx_totals
    finally:
        await db.close()


def generate_simulated_offers_and_funnel(merchant_name, category):
    """Generate realistic simulated offer events with proper funnel logic.
    
    Funnel: Pushed >= Read >= (Accepted + Dismissed + Expired), Redeemed <= Accepted
    Each offer follows a logical lifecycle, not random independent events.
    """
    headlines = {
        "cafe": ["Cold outside? ☕", "Morning pick-me-up", "Afternoon treat awaits", "Warm up here"],
        "restaurant": ["Hungry? We saved you a seat", "Lunch special just for you", "Taste something new today"],
        "bakery": ["Fresh from the oven 🥖", "Sweet tooth? We got you", "Bread of the day"],
        "bar": ["Happy hour is calling 🍺", "First drink on us", "Unwind after work"],
        "book_store": ["Rainy day? Perfect for reading 📚", "New arrivals this week", "Your next adventure awaits"],
    }
    category_headlines = headlines.get(category, headlines["cafe"])
    
    amount_ranges = {
        "cafe": (2.50, 8.00), "restaurant": (8.00, 35.00), "bakery": (2.00, 12.00),
        "bar": (4.00, 20.00), "book_store": (5.00, 40.00),
    }
    min_amt, max_amt = amount_ranges.get(category, (3.00, 15.00))

    now = datetime.now()
    
    # Step 1: Generate funnel numbers with proper cascading logic
    pushed = random.randint(18, 35)
    read = int(pushed * random.uniform(0.65, 0.85))
    accepted = int(read * random.uniform(0.25, 0.45))
    dismissed = int(read * random.uniform(0.15, 0.30))
    expired = read - accepted - dismissed
    if expired < 0:
        expired = 0
    redeemed = int(accepted * random.uniform(0.55, 0.85))
    
    funnel = {
        "generated": pushed,
        "displayed": read,
        "accepted": accepted,
        "redeemed": redeemed,
        "dismissed": dismissed,
        "expired": expired,
    }

    # Step 2: Generate individual events for the live feed (matching funnel numbers)
    events = []
    
    # Generate events for each lifecycle stage
    def add_events(count, event_type, icon, label, with_amount=False):
        for _ in range(count):
            minutes_ago = random.randint(1, 480)
            event_time = now - timedelta(minutes=minutes_ago)
            headline = random.choice(category_headlines)
            event = {
                "time": event_time.strftime("%H:%M"),
                "type": event_type,
                "icon": icon,
                "label": label,
                "headline": headline,
                "amount": round(random.uniform(min_amt, max_amt), 2) if with_amount else None,
                "discount": None,
            }
            if with_amount and event["amount"]:
                discount_pct = random.randint(5, 20) / 100
                event["discount"] = round(event["amount"] * discount_pct, 2)
            events.append(event)
    
    add_events(pushed, "offer_generated", "🤖", "AI Generated")
    add_events(read, "offer_displayed", "👁️", "Displayed to user")
    add_events(accepted, "offer_accepted", "✅", "Accepted")
    add_events(redeemed, "offer_redeemed", "📱", "QR Redeemed", with_amount=True)
    add_events(dismissed, "offer_dismissed", "❌", "Dismissed")
    add_events(expired, "offer_expired", "⏰", "Expired")

    events.sort(key=lambda x: x["time"], reverse=True)
    return events, funnel


def generate_html(merchants, rules, tx_hourly, tx_totals):
    # Prepare merchant data for JS
    merchant_list = []
    for m in merchants:
        mid = m["id"]
        rule = rules.get(mid, {})
        total = tx_totals.get(mid, {"count": 0, "total": 0})
        hourly = tx_hourly.get(mid, {})
        events, funnel = generate_simulated_offers_and_funnel(m["name"], m["category"])

        # Revenue from redeemed offers
        redeemed_revenue = sum(e["amount"] for e in events if e["amount"])
        redeemed_discount = sum(e["discount"] for e in events if e["discount"])

        merchant_list.append({
            "id": mid,
            "name": m["name"],
            "category": m["category"],
            "icon": CATEGORY_ICONS.get(m["category"], "🎁"),
            "color": CATEGORY_COLORS.get(m["category"], "#666"),
            "address": m["address"] or "",
            "rating": m["rating"],
            "txCount48h": total["count"],
            "txTotal48h": total["total"],
            "hourly": {str(h): hourly.get(h, {"count": 0, "amount": 0}) for h in range(24)},
            "rules": {
                "maxDiscount": rule.get("max_discount_percent", 15),
                "target": rule.get("target", "fill_quiet_hours"),
                "brandTone": rule.get("brand_tone", "cozy"),
                "budget": rule.get("daily_budget_eur", 50),
                "products": rule.get("product_scope", '["all"]'),
                "isActive": rule.get("is_active", True),
            },
            "events": events,
            "funnel": funnel,
            "revenue": {
                "total": round(redeemed_revenue, 2),
                "discount": round(redeemed_discount, 2),
                "net": round(redeemed_revenue - redeemed_discount, 2),
            }
        })

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>City Wallet — Merchant Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; }}
        
        /* Login overlay */
        #loginOverlay {{
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            z-index: 100; display: flex; align-items: center; justify-content: center;
        }}
        .login-card {{
            background: #fff; padding: 40px; border-radius: 20px; width: 420px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }}
        .login-card h1 {{ font-size: 24px; margin-bottom: 4px; }}
        .login-card h1 span {{ color: #e94560; }}
        .login-card p {{ font-size: 14px; color: #888; margin-bottom: 24px; }}
        .login-card label {{ font-size: 13px; color: #666; font-weight: 600; display: block; margin-bottom: 6px; }}
        .login-card select {{
            width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 10px;
            font-size: 15px; margin-bottom: 20px; appearance: none;
            background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 12px center;
        }}
        .login-card button {{
            width: 100%; padding: 14px; background: #e94560; color: #fff; border: none;
            border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;
        }}
        .login-card button:hover {{ background: #d63851; }}
        
        /* Dashboard */
        #dashboard {{ display: none; }}
        .top-bar {{
            background: #fff; padding: 16px 24px; border-bottom: 1px solid #e0e0e0;
            display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 50;
        }}
        .top-bar .merchant-info {{ display: flex; align-items: center; gap: 12px; }}
        .top-bar .merchant-icon {{
            width: 44px; height: 44px; border-radius: 12px; display: flex;
            align-items: center; justify-content: center; font-size: 22px;
        }}
        .top-bar h2 {{ font-size: 18px; }}
        .top-bar .meta {{ font-size: 12px; color: #888; }}
        .top-bar .status {{ display: flex; align-items: center; gap: 8px; }}
        .status-dot {{ width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; }}
        .top-bar .logout {{ padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; }}
        
        .dashboard-grid {{
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
            padding: 20px 24px; max-width: 1200px; margin: 0 auto;
        }}
        .card {{
            background: #fff; border-radius: 14px; padding: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }}
        .card h3 {{ font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }}
        .card.full {{ grid-column: 1 / -1; }}
        
        /* KPI cards */
        .kpi-row {{ display: flex; gap: 12px; }}
        .kpi {{
            flex: 1; background: #f8f9fa; padding: 16px; border-radius: 12px; text-align: center;
        }}
        .kpi .number {{ font-size: 28px; font-weight: 700; color: #1a1a2e; }}
        .kpi .label {{ font-size: 11px; color: #999; margin-top: 4px; }}
        
        /* Rate bars */
        .rate-row {{ display: flex; align-items: center; gap: 12px; margin: 8px 0; }}
        .rate-label {{ font-size: 13px; color: #666; width: 100px; }}
        .rate-bar-bg {{ flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }}
        .rate-bar {{ height: 100%; border-radius: 4px; transition: width 0.5s; }}
        .rate-value {{ font-size: 13px; font-weight: 600; width: 50px; text-align: right; }}
        
        /* Revenue */
        .revenue-grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }}
        .revenue-item {{ text-align: center; padding: 12px; background: #f8f9fa; border-radius: 10px; }}
        .revenue-item .value {{ font-size: 24px; font-weight: 700; }}
        .revenue-item .value.green {{ color: #2ecc71; }}
        .revenue-item .label {{ font-size: 11px; color: #999; margin-top: 2px; }}
        
        /* Hourly chart */
        .hourly-chart {{ display: flex; align-items: flex-end; gap: 3px; height: 100px; margin-top: 10px; }}
        .hour-bar {{
            flex: 1; border-radius: 3px 3px 0 0; min-width: 6px;
            transition: all 0.3s; cursor: pointer; position: relative;
        }}
        .hour-bar:hover {{ opacity: 0.8; }}
        .hour-bar .tooltip {{
            display: none; position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%);
            background: #333; color: #fff; padding: 4px 8px; border-radius: 4px;
            font-size: 10px; white-space: nowrap;
        }}
        .hour-bar:hover .tooltip {{ display: block; }}
        .chart-x {{ display: flex; justify-content: space-between; margin-top: 4px; }}
        .chart-x span {{ font-size: 10px; color: #bbb; }}
        
        /* Live feed */
        .feed-list {{ max-height: 400px; overflow-y: auto; }}
        .feed-item {{
            display: flex; align-items: flex-start; gap: 10px; padding: 10px 0;
            border-bottom: 1px solid #f5f5f5;
        }}
        .feed-item:last-child {{ border-bottom: none; }}
        .feed-time {{ font-size: 12px; color: #bbb; width: 45px; flex-shrink: 0; padding-top: 2px; }}
        .feed-icon {{ font-size: 16px; }}
        .feed-content {{ flex: 1; }}
        .feed-label {{ font-size: 13px; font-weight: 500; }}
        .feed-detail {{ font-size: 12px; color: #999; margin-top: 2px; }}
        
        /* Rules */
        .rule-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }}
        .rule-row:last-child {{ border-bottom: none; }}
        .rule-key {{ font-size: 13px; color: #666; }}
        .rule-val {{ font-size: 13px; font-weight: 600; }}
        .product-tags {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }}
        .product-tag {{ padding: 4px 10px; background: #f0f0f0; border-radius: 10px; font-size: 11px; }}
        
        /* Funnel */
        .funnel-row {{ display: flex; align-items: center; gap: 10px; margin: 6px 0; }}
        .funnel-label {{ font-size: 12px; width: 80px; color: #666; }}
        .funnel-bar-bg {{ flex: 1; height: 20px; background: #f0f0f0; border-radius: 6px; overflow: hidden; position: relative; }}
        .funnel-bar {{ height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 8px; }}
        .funnel-bar span {{ font-size: 11px; color: #fff; font-weight: 600; }}
    </style>
</head>
<body>
    <div id="loginOverlay">
        <div class="login-card">
            <h1>🏙️ City <span>Wallet</span></h1>
            <p>Merchant Dashboard — Log in to view your store</p>
            <label>Select your business</label>
            <select id="merchantSelect">
                <option value="">— Choose your store —</option>
            </select>
            <button onclick="login()">Enter Dashboard</button>
        </div>
    </div>
    
    <div id="dashboard">
        <div class="top-bar">
            <div class="merchant-info">
                <div class="merchant-icon" id="topIcon"></div>
                <div>
                    <h2 id="topName"></h2>
                    <div class="meta" id="topMeta"></div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:16px;">
                <div class="status"><span class="status-dot"></span><span style="font-size:12px;color:#2ecc71;">AI Active</span></div>
                <button class="logout" onclick="logout()">Switch Store</button>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card full">
                <h3>📊 Today's Performance</h3>
                <div class="kpi-row" id="kpiRow"></div>
                <div style="margin-top:16px;" id="ratesSection"></div>
            </div>
            
            <div class="card">
                <h3>💰 Revenue Impact</h3>
                <div class="revenue-grid" id="revenueGrid"></div>
            </div>
            
            <div class="card">
                <h3>📈 Offer Funnel</h3>
                <div id="funnelSection"></div>
            </div>
            
            <div class="card">
                <h3>⏰ Hourly Transaction Pattern (48h)</h3>
                <div class="hourly-chart" id="hourlyChart"></div>
                <div class="chart-x"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
            </div>
            
            <div class="card">
                <h3>🤖 AI Rules</h3>
                <div id="rulesSection"></div>
                <div class="product-tags" id="productsSection"></div>
            </div>
            
            <div class="card full">
                <h3>🔔 Live Feed</h3>
                <div class="feed-list" id="feedList"></div>
            </div>
        </div>
    </div>

    <script>
    const allMerchants = {json.dumps(merchant_list, ensure_ascii=False)};
    let current = null;

    // Populate login dropdown
    const sel = document.getElementById('merchantSelect');
    allMerchants.forEach(m => {{
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.icon + ' ' + m.name + ' (' + m.category + ')';
        sel.appendChild(opt);
    }});

    function login() {{
        const id = document.getElementById('merchantSelect').value;
        if (!id) return alert('Please select a store');
        current = allMerchants.find(m => m.id === id);
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        renderDashboard();
    }}

    function logout() {{
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }}

    function renderDashboard() {{
        const m = current;
        // Top bar
        const topIcon = document.getElementById('topIcon');
        topIcon.textContent = m.icon;
        topIcon.style.background = m.color + '20';
        document.getElementById('topName').textContent = m.name;
        document.getElementById('topMeta').textContent = '⭐ ' + m.rating + ' · ' + m.category + ' · ' + m.address;

        // KPIs
        const f = m.funnel;
        document.getElementById('kpiRow').innerHTML = `
            <div class="kpi"><div class="number">${{f.generated}}</div><div class="label">📤 Pushed</div></div>
            <div class="kpi"><div class="number">${{f.displayed}}</div><div class="label">👁️ Read</div></div>
            <div class="kpi"><div class="number">${{f.accepted}}</div><div class="label">✅ Accepted</div></div>
            <div class="kpi"><div class="number">${{f.redeemed}}</div><div class="label">📱 Redeemed</div></div>
            <div class="kpi"><div class="number">${{f.dismissed}}</div><div class="label">❌ Dismissed</div></div>
            <div class="kpi"><div class="number">${{f.expired}}</div><div class="label">⏰ Expired</div></div>
        `;

        // Rates
        const total = f.generated + f.displayed;
        const acceptRate = total > 0 ? Math.round(f.accepted / total * 100) : 0;
        const redeemRate = f.accepted > 0 ? Math.round(f.redeemed / f.accepted * 100) : 0;
        document.getElementById('ratesSection').innerHTML = `
            <div class="rate-row">
                <span class="rate-label">Acceptance</span>
                <div class="rate-bar-bg"><div class="rate-bar" style="width:${{acceptRate}}%;background:#e94560;"></div></div>
                <span class="rate-value">${{acceptRate}}%</span>
            </div>
            <div class="rate-row">
                <span class="rate-label">Redemption</span>
                <div class="rate-bar-bg"><div class="rate-bar" style="width:${{redeemRate}}%;background:#2ecc71;"></div></div>
                <span class="rate-value">${{redeemRate}}%</span>
            </div>
        `;

        // Revenue
        document.getElementById('revenueGrid').innerHTML = `
            <div class="revenue-item"><div class="value">€${{m.revenue.total}}</div><div class="label">Total Revenue</div></div>
            <div class="revenue-item"><div class="value" style="color:#e94560;">-€${{m.revenue.discount}}</div><div class="label">Discount Given</div></div>
            <div class="revenue-item"><div class="value green">€${{m.revenue.net}}</div><div class="label">Net Incremental</div></div>
        `;

        // Funnel
        const maxFunnel = Math.max(f.generated, f.displayed, 1);
        document.getElementById('funnelSection').innerHTML = `
            <div class="funnel-row"><span class="funnel-label">📤 Pushed</span><div class="funnel-bar-bg"><div class="funnel-bar" style="width:${{f.generated/maxFunnel*100}}%;background:#3498db;"><span>${{f.generated}}</span></div></div></div>
            <div class="funnel-row"><span class="funnel-label">👁️ Read</span><div class="funnel-bar-bg"><div class="funnel-bar" style="width:${{f.displayed/maxFunnel*100}}%;background:#2ecc71;"><span>${{f.displayed}}</span></div></div></div>
            <div class="funnel-row"><span class="funnel-label">✅ Accepted</span><div class="funnel-bar-bg"><div class="funnel-bar" style="width:${{f.accepted/maxFunnel*100}}%;background:#f39c12;"><span>${{f.accepted}}</span></div></div></div>
            <div class="funnel-row"><span class="funnel-label">📱 Redeemed</span><div class="funnel-bar-bg"><div class="funnel-bar" style="width:${{f.redeemed/maxFunnel*100}}%;background:#e94560;"><span>${{f.redeemed}}</span></div></div></div>
        `;

        // Hourly chart
        const chart = document.getElementById('hourlyChart');
        chart.innerHTML = '';
        const hourly = m.hourly;
        let maxH = 0;
        for (let h = 0; h < 24; h++) maxH = Math.max(maxH, (hourly[h] || {{count:0}}).count || 0);
        const currentHour = new Date().getHours();
        for (let h = 0; h < 24; h++) {{
            const cnt = (hourly[h] || {{count:0}}).count || 0;
            const pct = maxH > 0 ? (cnt / maxH * 100) : 2;
            const isQuiet = cnt < maxH * 0.3;
            const isCurrent = h === currentHour;
            const bar = document.createElement('div');
            bar.className = 'hour-bar';
            bar.style.height = Math.max(2, pct) + '%';
            bar.style.background = isCurrent ? '#e94560' : (isQuiet ? '#ffcdd2' : m.color);
            bar.innerHTML = `<div class="tooltip">${{h}}:00 — ${{cnt}} tx${{isQuiet ? ' ⚠️ quiet' : ''}}</div>`;
            chart.appendChild(bar);
        }}

        // Rules (editable form)
        const r = m.rules;
        const discountOptions = [5,10,15,20,25,30].map(v => 
            `<option value="${{v}}" ${{v === r.maxDiscount ? 'selected' : ''}}>${{v}}%</option>`
        ).join('');
        const targetOptions = ['fill_quiet_hours','lunch_rush','rainy_day_special','end_of_day_clearance','early_bird_special'].map(v =>
            `<option value="${{v}}" ${{v === r.target ? 'selected' : ''}}>${{v.replace(/_/g,' ')}}</option>`
        ).join('');
        const toneOptions = ['cozy','professional','energetic','warm','fresh'].map(v =>
            `<option value="${{v}}" ${{v === r.brandTone ? 'selected' : ''}}>${{v}}</option>`
        ).join('');
        
        let products = [];
        try {{ products = JSON.parse(r.products); }} catch(e) {{ products = ['all']; }}
        const allProducts = ['hot_drinks','cold_drinks','pastries','lunch_menu','bread','cakes','drinks','snacks','books','stationery','gifts'];
        const productCheckboxes = allProducts.map(p => 
            `<label style="display:inline-flex;align-items:center;gap:4px;margin:3px 6px 3px 0;font-size:12px;cursor:pointer;">
                <input type="checkbox" ${{products.includes(p) || products.includes('all') ? 'checked' : ''}} value="${{p}}" onchange="updateProducts()"> ${{p.replace(/_/g,' ')}}
            </label>`
        ).join('');

        document.getElementById('rulesSection').innerHTML = `
            <div class="rule-row">
                <span class="rule-key">Max Discount</span>
                <select id="ruleDiscount" style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;">${{discountOptions}}</select>
            </div>
            <div class="rule-row">
                <span class="rule-key">Target</span>
                <select id="ruleTarget" style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;">${{targetOptions}}</select>
            </div>
            <div class="rule-row">
                <span class="rule-key">Brand Tone</span>
                <select id="ruleTone" style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;">${{toneOptions}}</select>
            </div>
            <div class="rule-row">
                <span class="rule-key">Daily Budget</span>
                <div style="display:flex;align-items:center;gap:4px;">
                    <span style="font-size:13px;font-weight:600;">€</span>
                    <input id="ruleBudget" type="number" value="${{r.budget}}" min="10" max="500" step="10" style="width:70px;padding:6px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;">
                </div>
            </div>
            <div class="rule-row">
                <span class="rule-key">Max Offers / Day</span>
                <input id="ruleMaxOffers" type="number" value="${{r.maxOffers || 30}}" min="1" max="200" step="5" style="width:70px;padding:6px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;">
            </div>
            <div class="rule-row">
                <span class="rule-key">Status</span>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="ruleActive" ${{r.isActive ? 'checked' : ''}} onchange="toggleStatus()" style="width:18px;height:18px;">
                    <span id="statusLabel" style="font-size:13px;font-weight:600;color:${{r.isActive ? '#2ecc71' : '#e74c3c'}}">${{r.isActive ? '✅ Active' : '⏸️ Paused'}}</span>
                </label>
            </div>
            <div style="margin-top:12px;">
                <span class="rule-key" style="display:block;margin-bottom:6px;">Products</span>
                <div id="productCheckboxes">${{productCheckboxes}}</div>
            </div>
            <div style="margin-top:16px;display:flex;gap:10px;">
                <button onclick="saveRules()" style="flex:1;padding:10px;background:#e94560;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">💾 Save Rules</button>
                <button onclick="togglePause()" id="pauseBtn" style="flex:1;padding:10px;background:${{r.isActive ? '#f5f5f5' : '#2ecc71'}};color:${{r.isActive ? '#666' : '#fff'}};border:1px solid #ddd;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">${{r.isActive ? '⏸️ Pause Offers' : '▶️ Resume Offers'}}</button>
            </div>
            <div id="saveConfirm" style="display:none;margin-top:10px;padding:8px 12px;background:#d4edda;color:#155724;border-radius:8px;font-size:13px;text-align:center;">✅ Rules saved successfully!</div>
        `;
        const prodEl = document.getElementById('productsSection');
        prodEl.innerHTML = '';

        // Feed
        const feedEl = document.getElementById('feedList');
        feedEl.innerHTML = '';
        m.events.forEach(e => {{
            let detail = e.headline;
            if (e.amount) detail += ` · €${{e.amount}} · -€${{e.discount}} discount`;
            feedEl.innerHTML += `
                <div class="feed-item">
                    <span class="feed-time">${{e.time}}</span>
                    <span class="feed-icon">${{e.icon}}</span>
                    <div class="feed-content">
                        <div class="feed-label">${{e.label}}</div>
                        <div class="feed-detail">${{detail}}</div>
                    </div>
                </div>`;
        }});
    }}

    function saveRules() {{
        // Read all form values
        const rules = {{
            maxDiscount: parseInt(document.getElementById('ruleDiscount').value),
            target: document.getElementById('ruleTarget').value,
            brandTone: document.getElementById('ruleTone').value,
            budget: parseFloat(document.getElementById('ruleBudget').value),
            maxOffers: parseInt(document.getElementById('ruleMaxOffers').value),
            isActive: document.getElementById('ruleActive').checked,
            products: getSelectedProducts(),
        }};
        // Update in-memory data
        current.rules = {{ ...current.rules, ...rules }};
        // Show confirmation
        const confirm = document.getElementById('saveConfirm');
        confirm.style.display = 'block';
        setTimeout(() => {{ confirm.style.display = 'none'; }}, 3000);
        console.log('Rules saved:', rules);
    }}

    function toggleStatus() {{
        const active = document.getElementById('ruleActive').checked;
        const label = document.getElementById('statusLabel');
        label.textContent = active ? '✅ Active' : '⏸️ Paused';
        label.style.color = active ? '#2ecc71' : '#e74c3c';
    }}

    function togglePause() {{
        const cb = document.getElementById('ruleActive');
        cb.checked = !cb.checked;
        toggleStatus();
        const btn = document.getElementById('pauseBtn');
        btn.textContent = cb.checked ? '⏸️ Pause Offers' : '▶️ Resume Offers';
        btn.style.background = cb.checked ? '#f5f5f5' : '#2ecc71';
        btn.style.color = cb.checked ? '#666' : '#fff';
    }}

    function getSelectedProducts() {{
        const checkboxes = document.querySelectorAll('#productCheckboxes input[type=checkbox]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }}

    function updateProducts() {{
        // Products auto-save visual feedback (optional)
    }}
    </script>
</body>
</html>"""
    return html


async def main():
    print("🏪 Generating Merchant Dashboard...")
    merchants, rules, tx_hourly, tx_totals = await get_all_data()
    html = generate_html(merchants, rules, tx_hourly, tx_totals)
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "merchant_dashboard.html")
    with open(output_path, "w") as f:
        f.write(html)
    
    abs_path = os.path.abspath(output_path)
    print(f"✅ Saved to: {abs_path}")
    print("🌐 Opening in browser...")
    webbrowser.open(f"file://{abs_path}")


if __name__ == "__main__":
    asyncio.run(main())
