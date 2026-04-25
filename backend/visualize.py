"""
Generate an HTML visualization of seeded merchants on Google Maps.
Improved: side panel for merchant details instead of small bottom-right card.
Run: python visualize.py
"""

import asyncio
import json
import os
import sys
import webbrowser

sys.path.insert(0, os.path.dirname(__file__))

from models.database import get_db
from config.settings import settings


CATEGORY_CONFIG = {
    "cafe": {"color": "#8B4513", "icon": "☕", "label": "Café"},
    "restaurant": {"color": "#E74C3C", "icon": "🍽️", "label": "Restaurant"},
    "bakery": {"color": "#F39C12", "icon": "🥖", "label": "Bakery"},
    "bar": {"color": "#9B59B6", "icon": "🍺", "label": "Bar"},
    "book_store": {"color": "#3498DB", "icon": "📚", "label": "Bookstore"},
}


async def get_merchants():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, category, lat, lon, rating, address FROM merchants ORDER BY category"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_tx_summary():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT merchant_id, COUNT(*) as tx_count FROM simulated_transactions GROUP BY merchant_id"
        )
        rows = await cursor.fetchall()
        return {row["merchant_id"]: row["tx_count"] for row in rows}
    finally:
        await db.close()


async def get_rules():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT merchant_id, max_discount_percent, target, product_scope, brand_tone, daily_budget_eur FROM merchant_rules"
        )
        rows = await cursor.fetchall()
        return {row["merchant_id"]: dict(row) for row in rows}
    finally:
        await db.close()


async def get_hourly_tx(merchant_id):
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as cnt
               FROM simulated_transactions WHERE merchant_id = ?
               GROUP BY hour ORDER BY hour""",
            [merchant_id]
        )
        rows = await cursor.fetchall()
        result = {row["hour"]: row["cnt"] for row in rows}
        return result
    finally:
        await db.close()


def generate_html(merchants, tx_counts, rules, api_key):
    avg_lat = sum(m["lat"] for m in merchants) / len(merchants)
    avg_lon = sum(m["lon"] for m in merchants) / len(merchants)

    # Build merchant data JSON for JavaScript
    merchant_data = []
    for m in merchants:
        cat = CATEGORY_CONFIG.get(m["category"], CATEGORY_CONFIG["cafe"])
        tx = tx_counts.get(m["id"], 0)
        rule = rules.get(m["id"], {})
        merchant_data.append({
            "id": m["id"],
            "lat": m["lat"],
            "lng": m["lon"],
            "name": m["name"],
            "category": m["category"],
            "icon": cat["icon"],
            "color": cat["color"],
            "label": cat["label"],
            "rating": m["rating"],
            "address": m["address"],
            "txCount": tx,
            "maxDiscount": rule.get("max_discount_percent", 15),
            "target": rule.get("target", "fill_quiet_hours"),
            "brandTone": rule.get("brand_tone", "cozy"),
            "budget": rule.get("daily_budget_eur", 50),
            "products": rule.get("product_scope", "[]"),
        })

    legend_items = ""
    for cat_key, cat in CATEGORY_CONFIG.items():
        count = sum(1 for m in merchants if m["category"] == cat_key)
        if count > 0:
            legend_items += f'<div class="legend-item"><span class="dot" style="background:{cat["color"]}"></span>{cat["icon"]} {cat["label"]} ({count})</div>\n'

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>City Wallet — Merchant Map · {settings.DEFAULT_CITY.title()}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; height: 100vh; overflow: hidden; }}
        
        /* Map area */
        #mapContainer {{ flex: 1; position: relative; }}
        #map {{ width: 100%; height: 100%; }}
        
        .header {{
            position: absolute; top: 0; left: 0; right: 0; z-index: 10;
            background: rgba(255,255,255,0.95); padding: 12px 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            display: flex; align-items: center; justify-content: space-between;
        }}
        .header h1 {{ font-size: 17px; color: #1a1a2e; }}
        .header h1 span {{ color: #e94560; }}
        .stats {{ font-size: 12px; color: #888; }}
        .stats b {{ color: #333; }}
        
        .legend {{
            position: absolute; bottom: 20px; left: 16px; z-index: 10;
            background: rgba(255,255,255,0.93); padding: 12px 16px;
            border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.12);
        }}
        .legend h3 {{ font-size: 12px; margin-bottom: 6px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }}
        .legend-item {{ font-size: 12px; margin: 3px 0; display: flex; align-items: center; gap: 6px; }}
        .dot {{ width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }}
        
        /* Side panel */
        #sidePanel {{
            width: 380px; height: 100vh; background: #fafafa;
            border-left: 1px solid #e0e0e0; overflow-y: auto;
            transition: all 0.3s ease;
        }}
        
        .panel-header {{
            padding: 20px; background: #fff; border-bottom: 1px solid #eee;
            position: sticky; top: 0; z-index: 5;
        }}
        .panel-header h2 {{ font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px; }}
        
        /* Empty state */
        .empty-state {{
            padding: 60px 30px; text-align: center; color: #bbb;
        }}
        .empty-state .big-icon {{ font-size: 48px; margin-bottom: 16px; }}
        .empty-state p {{ font-size: 14px; line-height: 1.6; }}
        
        /* Merchant detail */
        .merchant-detail {{ display: none; }}
        .merchant-detail.active {{ display: block; }}
        
        .detail-hero {{
            padding: 24px 20px; background: #fff; border-bottom: 1px solid #eee;
        }}
        .detail-hero .icon-badge {{
            width: 56px; height: 56px; border-radius: 14px; display: flex;
            align-items: center; justify-content: center; font-size: 28px;
            margin-bottom: 12px;
        }}
        .detail-hero h3 {{ font-size: 20px; margin-bottom: 4px; color: #1a1a2e; line-height: 1.3; }}
        .detail-hero .category-badge {{
            display: inline-block; padding: 3px 10px; border-radius: 12px;
            font-size: 11px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.5px; color: #fff; margin-top: 6px;
        }}
        .detail-hero .rating {{ font-size: 15px; margin-top: 10px; color: #333; }}
        .detail-hero .address {{ font-size: 13px; color: #888; margin-top: 6px; }}
        
        .detail-section {{
            padding: 16px 20px; background: #fff;
            margin-top: 8px;
        }}
        .detail-section h4 {{
            font-size: 11px; color: #999; text-transform: uppercase;
            letter-spacing: 0.8px; margin-bottom: 10px;
        }}
        
        .stat-grid {{
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }}
        .stat-card {{
            background: #f5f5f5; padding: 12px; border-radius: 10px;
        }}
        .stat-card .value {{ font-size: 22px; font-weight: 700; color: #1a1a2e; }}
        .stat-card .label {{ font-size: 11px; color: #888; margin-top: 2px; }}
        
        .rule-row {{
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 0; border-bottom: 1px solid #f0f0f0;
        }}
        .rule-row:last-child {{ border-bottom: none; }}
        .rule-row .rule-label {{ font-size: 13px; color: #666; }}
        .rule-row .rule-value {{ font-size: 13px; font-weight: 600; color: #333; }}
        
        .product-tags {{
            display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;
        }}
        .product-tag {{
            padding: 4px 10px; background: #f0f0f0; border-radius: 12px;
            font-size: 11px; color: #555;
        }}
        
        /* Hourly chart */
        .hourly-chart {{
            display: flex; align-items: flex-end; gap: 2px; height: 60px; margin-top: 8px;
        }}
        .hour-bar {{
            flex: 1; background: #ddd; border-radius: 2px 2px 0 0;
            min-width: 4px; transition: background 0.2s;
        }}
        .hour-bar.active {{ background: #e94560; }}
        .chart-labels {{
            display: flex; justify-content: space-between; margin-top: 4px;
        }}
        .chart-labels span {{ font-size: 9px; color: #aaa; }}
    </style>
</head>
<body>
    <div id="mapContainer">
        <div class="header">
            <h1>🏙️ City <span>Wallet</span> — Merchant Map</h1>
            <div class="stats">
                <b>{len(merchants)}</b> merchants · 
                <b>{sum(tx_counts.values()):,}</b> transactions (48h) ·
                📍 {settings.DEFAULT_CITY.title()}
            </div>
        </div>
        <div class="legend">
            <h3>Types</h3>
            {legend_items}
        </div>
        <div id="map"></div>
    </div>
    
    <div id="sidePanel">
        <div class="panel-header">
            <h2>Merchant Details</h2>
        </div>
        
        <div id="emptyState" class="empty-state">
            <div class="big-icon">👈</div>
            <p>Click a merchant marker on the map to see details</p>
        </div>
        
        <div id="merchantDetail" class="merchant-detail">
            <div class="detail-hero">
                <div class="icon-badge" id="detailIconBadge">☕</div>
                <h3 id="detailName"></h3>
                <span class="category-badge" id="detailCategory"></span>
                <div class="rating" id="detailRating"></div>
                <div class="address" id="detailAddress"></div>
            </div>
            
            <div class="detail-section">
                <h4>📊 Transaction Activity (48h)</h4>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="value" id="detailTxCount">0</div>
                        <div class="label">Total transactions</div>
                    </div>
                    <div class="stat-card">
                        <div class="value" id="detailTxAvg">0</div>
                        <div class="label">Avg per hour</div>
                    </div>
                </div>
                <div class="hourly-chart" id="hourlyChart"></div>
                <div class="chart-labels">
                    <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>🤖 AI Rules</h4>
                <div class="rule-row">
                    <span class="rule-label">Max Discount</span>
                    <span class="rule-value" id="detailDiscount"></span>
                </div>
                <div class="rule-row">
                    <span class="rule-label">Target</span>
                    <span class="rule-value" id="detailTarget"></span>
                </div>
                <div class="rule-row">
                    <span class="rule-label">Brand Tone</span>
                    <span class="rule-value" id="detailTone"></span>
                </div>
                <div class="rule-row">
                    <span class="rule-label">Daily Budget</span>
                    <span class="rule-value" id="detailBudget"></span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>🏷️ Product Scope</h4>
                <div class="product-tags" id="detailProducts"></div>
            </div>
        </div>
    </div>

    <script>
        const merchantData = {json.dumps(merchant_data)};
        let map;
        let selectedMarker = null;

        function showMerchant(data) {{
            document.getElementById('emptyState').style.display = 'none';
            const detail = document.getElementById('merchantDetail');
            detail.classList.add('active');

            // Icon badge
            const badge = document.getElementById('detailIconBadge');
            badge.textContent = data.icon;
            badge.style.background = data.color + '20';

            // Basic info
            document.getElementById('detailName').textContent = data.name;
            
            const catBadge = document.getElementById('detailCategory');
            catBadge.textContent = data.label;
            catBadge.style.background = data.color;
            
            const stars = '⭐'.repeat(Math.round(data.rating));
            document.getElementById('detailRating').innerHTML = stars + ' <b>' + data.rating + '</b>/5';
            document.getElementById('detailAddress').textContent = '📍 ' + data.address;
            
            // Transaction stats
            document.getElementById('detailTxCount').textContent = data.txCount.toLocaleString();
            document.getElementById('detailTxAvg').textContent = Math.round(data.txCount / 48);
            
            // Hourly chart (simulated from txCount)
            const chart = document.getElementById('hourlyChart');
            chart.innerHTML = '';
            const currentHour = new Date().getHours();
            for (let h = 0; h < 24; h++) {{
                const bar = document.createElement('div');
                bar.className = 'hour-bar' + (h === currentHour ? ' active' : '');
                // Simulate hourly pattern
                let ratio = 0;
                if (data.category === 'cafe') ratio = [0,0,0,0,0,0,.1,.5,1,.8,.5,.4,.7,.5,.4,.3,.2,.2,.1,0,0,0,0,0][h];
                else if (data.category === 'restaurant') ratio = [0,0,0,0,0,0,0,.05,.1,.2,.3,.8,1,.9,.3,.2,.3,.5,.9,1,.7,.3,.1,0][h];
                else if (data.category === 'bakery') ratio = [0,0,0,0,0,.2,.5,1,.8,.5,.4,.3,.5,.3,.2,.1,.1,0,0,0,0,0,0,0][h];
                else if (data.category === 'bar') ratio = [0,0,0,0,0,0,0,0,0,0,0,.05,.1,.1,.15,.2,.3,.5,.75,.9,1,.9,.6,.25][h];
                else ratio = [0,0,0,0,0,0,0,0,.1,.3,.5,.6,.4,.5,.6,.5,.4,.3,.2,.1,0,0,0,0][h];
                bar.style.height = Math.max(2, ratio * 100) + '%';
                chart.appendChild(bar);
            }}
            
            // AI Rules
            document.getElementById('detailDiscount').textContent = data.maxDiscount + '%';
            document.getElementById('detailTarget').textContent = data.target.replace(/_/g, ' ');
            document.getElementById('detailTone').textContent = data.brandTone;
            document.getElementById('detailBudget').textContent = '€' + data.budget;
            
            // Products
            const productsEl = document.getElementById('detailProducts');
            productsEl.innerHTML = '';
            try {{
                const products = JSON.parse(data.products);
                products.forEach(p => {{
                    const tag = document.createElement('span');
                    tag.className = 'product-tag';
                    tag.textContent = p.replace(/_/g, ' ');
                    productsEl.appendChild(tag);
                }});
            }} catch(e) {{
                productsEl.innerHTML = '<span class="product-tag">all</span>';
            }}
        }}

        function initMap() {{
            map = new google.maps.Map(document.getElementById('map'), {{
                center: {{ lat: {avg_lat}, lng: {avg_lon} }},
                zoom: 16,
                styles: [
                    {{ featureType: "poi", stylers: [{{ visibility: "off" }}] }},
                    {{ featureType: "transit", stylers: [{{ visibility: "off" }}] }}
                ],
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            }});

            merchantData.forEach(data => {{
                const marker = new google.maps.Marker({{
                    position: {{ lat: data.lat, lng: data.lng }},
                    map: map,
                    title: data.name,
                    label: {{ text: data.icon, fontSize: '18px' }},
                    icon: {{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: data.color,
                        fillOpacity: 0.9,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                        scale: 15
                    }}
                }});

                marker.addListener('click', () => {{
                    if (selectedMarker) {{
                        selectedMarker.setIcon({{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: selectedMarker._color,
                            fillOpacity: 0.9,
                            strokeColor: '#fff',
                            strokeWeight: 2,
                            scale: 15
                        }});
                    }}
                    selectedMarker = marker;
                    selectedMarker._color = data.color;
                    marker.setIcon({{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: data.color,
                        fillOpacity: 1,
                        strokeColor: '#333',
                        strokeWeight: 3,
                        scale: 20
                    }});
                    showMerchant(data);
                }});
            }});
        }}
    </script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initMap">
    </script>
</body>
</html>"""
    return html


async def main():
    print("🗺️  Generating merchant visualization...")
    merchants = await get_merchants()
    tx_counts = await get_tx_summary()
    rules_data = await get_rules()
    
    html = generate_html(merchants, tx_counts, rules_data, settings.GOOGLE_MAPS_API_KEY)
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "visualize_merchants.html")
    with open(output_path, "w") as f:
        f.write(html)
    
    abs_path = os.path.abspath(output_path)
    print(f"✅ Saved to: {abs_path}")
    print("🌐 Opening in browser...")
    webbrowser.open(f"file://{abs_path}")


if __name__ == "__main__":
    asyncio.run(main())
