# 🔌 City Wallet — 前后端接口文档

## 给前端队友的说明

**后端地址**: `http://localhost:8000`  
**数据格式**: 所有请求和响应都是 JSON  
**跨域**: 已开启 CORS，允许 `http://localhost:3000`  
**自动文档**: 启动后端后访问 `http://localhost:8000/docs` 查看 Swagger UI

---

## 接口总览

| 方法 | 接口 | 谁用 | 功能 |
|------|------|------|------|
| GET | `/api/health` | 通用 | 健康检查 |
| POST | `/api/context` | 消费者App | 获取上下文（天气+商户+触发分数）|
| POST | `/api/offers/generate` | 消费者App | AI生成个性化offer |
| GET | `/api/offers/{id}` | 通用 | 获取offer详情 |
| POST | `/api/offers/{id}/accept` | 消费者App | 接受offer → 获取QR码 |
| POST | `/api/offers/{id}/dismiss` | 消费者App | 拒绝offer |
| POST | `/api/offers/{id}/redeem` | 商户Dashboard | 扫码核销 + 返现 |
| GET | `/api/wallet/{user_id}` | 消费者App | 钱包余额 + 历史 |
| GET | `/api/merchants` | 商户Dashboard | 商户列表 |
| GET | `/api/merchants/{id}` | 商户Dashboard | 商户详情 + 规则 |
| PUT | `/api/merchants/{id}/rules` | 商户Dashboard | 更新AI规则 |
| GET | `/api/merchants/{id}/analytics` | 商户Dashboard | 漏斗 + 收入数据 |
| GET | `/api/merchants/{id}/feed` | 商户Dashboard | 实时事件流 |

---

## 一、消费者App接口

### 1. POST `/api/context` — 获取环境上下文

**用途**: 获取用户周围的完整环境信息 — 天气、时间、附近商户、交易密度和触发分数。

**什么时候调用**: 获取到用户GPS位置和设备端意图推断结果后。

**请求体**:
```json
{
    "lat": 48.1371,
    "lon": 11.5754,
    "user_intent": "browsing_food",
    "confidence": 0.85,
    "zone": "marienplatz"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | float | ✅ | 用户纬度 |
| lon | float | ✅ | 用户经度 |
| user_intent | string | ❌ | 设备端推断的意图。可选值: `browsing_food` / `browsing_general` / `commuting` / `stationary` |
| confidence | float | ❌ | 意图置信度 0-1，默认0.5 |
| zone | string | ❌ | 区域名称（GDPR合规 — 发区域名而非精确GPS）|

**响应** (200):
```json
{
    "weather": {
        "temp": 11.2,
        "feels_like": 8.5,
        "condition": "Clouds",
        "description": "overcast clouds",
        "humidity": 72,
        "wind_speed": 4.1,
        "icon": "☁️",
        "trigger": "cold"
    },
    "time": {
        "current": "2025-01-14T12:15:00",
        "slot": "lunch_break",
        "day_type": "weekday",
        "label": "Tuesday Lunch"
    },
    "user_intent": {
        "type": "browsing_food",
        "confidence": 0.85
    },
    "nearby_merchants": [
        {
            "id": "m_abc123",
            "name": "Café Glockenspiel",
            "category": "cafe",
            "lat": 48.1369,
            "lon": 11.5752,
            "rating": 4.6,
            "photo_url": "https://maps.googleapis.com/...",
            "distance_m": 80,
            "tx_density": {
                "current_hour": 3,
                "avg_hour": 12,
                "status": "very_low",
                "demand_gap": 0.75
            }
        }
    ],
    "composite_trigger": "warm_drink_opportunity",
    "trigger_score": 0.92
}
```

**前端关注的重点字段**:
- `trigger_score` > 0.7 → 应该生成offer
- `nearby_merchants[0]` → 最匹配的商户
- `tx_density.status` = "very_low" → 商户需要引流

---

### 2. POST `/api/offers/generate` — AI生成个性化Offer

**用途**: 这是核心GenUI接口。AI根据上下文动态生成offer，响应包含渲染offer卡片所需的全部数据（标题、颜色、图标、折扣等）。

**什么时候调用**: 获取上下文后，如果 `trigger_score` > 0.7。

**请求体**:
```json
{
    "lat": 48.1371,
    "lon": 11.5754,
    "user_intent": "browsing_food",
    "confidence": 0.85,
    "zone": "marienplatz",
    "merchant_id": "m_abc123",
    "user_id": "user_demo_001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat, lon | float | ✅ | 用户位置 |
| user_intent | string | ❌ | 意图类型 |
| merchant_id | string | ❌ | 指定商户，传null则自动选择最佳匹配 |
| user_id | string | ❌ | 匿名用户ID，默认"anonymous" |

**响应** (200):
```json
{
    "id": "offer_abc123",
    "merchant": {
        "id": "m_abc123",
        "name": "Café Glockenspiel",
        "category": "cafe",
        "rating": 4.6,
        "photo_url": "https://...",
        "distance_m": 80
    },
    "content": {
        "headline": "Cold outside? ☕",
        "subtext": "Your cappuccino is waiting at Café Glockenspiel, just 80m away",
        "discount_percent": 15,
        "original_item": "cappuccino",
        "cta_text": "Warm Up Now",
        "mood": "cozy",
        "color_primary": "#8B4513",
        "color_background": "#FFF8DC",
        "color_accent": "#D2691E",
        "icon": "☕",
        "valid_minutes": 15,
        "reasoning": "Cold weather + browsing for food + quiet café → warm drink offer"
    },
    "status": "generated",
    "created_at": "2025-01-14T12:15:00",
    "expires_at": "2025-01-14T12:30:00"
}
```

**⚡ GenUI: 如何渲染offer卡片**:

| 字段 | 用途 | 渲染方式 |
|------|------|----------|
| `content.icon` | 大图标 | 48px emoji，卡片顶部 |
| `content.headline` | 情感标题 | 24px 加粗 |
| `content.subtext` | 描述文案 | 16px 正文 |
| `content.color_background` | 卡片背景色 | CSS background |
| `content.color_primary` | 按钮颜色 | CSS button background |
| `content.color_accent` | 折扣标签色 | CSS badge background |
| `content.mood` | 动画风格 | cozy=渐入, energetic=弹跳, fresh=上滑 |
| `content.cta_text` | 按钮文字 | 按钮label |
| `content.discount_percent` | 折扣百分比 | "15% off" |
| `merchant.distance_m` | 距离 | "80m away" |
| `content.valid_minutes` | 有效时间 | 倒计时器 |

---

### 3. POST `/api/offers/{id}/accept` — 接受Offer

**用途**: 用户点击"接受"按钮。后端生成QR码和核销token。

**请求**: 不需要请求体（offer ID在URL中）。

**响应** (200):
```json
{
    "id": "offer_abc123",
    "merchant": { "..." },
    "content": { "..." },
    "status": "accepted",
    "created_at": "2025-01-14T12:15:00",
    "expires_at": "2025-01-14T12:30:00",
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "token": "CW-2025-a1b2c3d4e5f6"
}
```

**前端应该**:
- `qr_code` 是base64图片，直接作为 `<img src={qr_code}>` 展示
- 用 `expires_at` 做倒计时
- 显示 "到 [merchant.name] 出示此码"
- 显示距离/导航提示

---

### 4. POST `/api/offers/{id}/dismiss` — 拒绝Offer

**用途**: 用户滑走/关闭offer。

**请求**: 不需要请求体。

**响应** (200):
```json
{
    "status": "dismissed",
    "message": "Not your vibe? Got it."
}
```

---

### 5. GET `/api/wallet/{user_id}` — 钱包余额

**用途**: 获取用户的返现钱包余额和交易历史。

**响应** (200):
```json
{
    "user_id": "user_demo_001",
    "balance": 3.24,
    "transactions": [
        {
            "id": 1,
            "type": "cashback",
            "amount": 0.68,
            "description": "15% cashback at Café Glockenspiel",
            "created_at": "2025-01-14T12:20:00"
        },
        {
            "id": 2,
            "type": "cashback",
            "amount": 1.36,
            "description": "10% cashback at Rischart",
            "created_at": "2025-01-13T14:30:00"
        }
    ]
}
```

---

## 二、商户Dashboard接口

### 6. GET `/api/merchants` — 商户列表

**用途**: 获取所有商户（用于登录/选择界面）。

**响应** (200):
```json
[
    {
        "id": "m_abc123",
        "name": "Café Glockenspiel",
        "category": "cafe",
        "address": "Marienplatz 28, Munich",
        "rating": 4.6
    }
]
```

---

### 7. GET `/api/merchants/{id}` — 商户详情

**用途**: 获取单个商户的详细信息和当前AI规则。

**响应** (200):
```json
{
    "merchant": {
        "id": "m_abc123",
        "name": "Café Glockenspiel",
        "category": "cafe",
        "address": "Marienplatz 28, Munich",
        "lat": 48.1369,
        "lon": 11.5752,
        "rating": 4.6,
        "photo_url": "https://..."
    },
    "rules": {
        "merchant_id": "m_abc123",
        "max_discount_percent": 20,
        "target": "fill_quiet_hours",
        "product_scope": ["hot_drinks", "pastries"],
        "brand_tone": "cozy",
        "daily_budget_eur": 40.0,
        "budget_spent_today": 3.38,
        "is_active": true
    }
}
```

---

### 8. PUT `/api/merchants/{id}/rules` — 更新AI规则

**用途**: 商户修改AI生成offer的规则。只需发送要修改的字段。

**请求体**:
```json
{
    "max_discount_percent": 25,
    "target": "rainy_day_special",
    "daily_budget_eur": 60.0,
    "is_active": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| max_discount_percent | int | 最大折扣 5-50% |
| target | string | 目标: fill_quiet_hours / lunch_rush / rainy_day_special / end_of_day_clearance / early_bird_special |
| product_scope | string[] | 产品范围: ["hot_drinks", "pastries", ...] |
| brand_tone | string | 品牌调性: cozy / professional / energetic / warm / fresh |
| daily_budget_eur | float | 每日预算上限(欧元) |
| is_active | bool | 是否激活（暂停/恢复offers）|

**响应** (200):
```json
{
    "status": "updated",
    "rules": { "...更新后的完整规则..." }
}
```

---

### 9. GET `/api/merchants/{id}/analytics` — 数据分析

**用途**: 获取漏斗数据、转化率和收入影响。

**查询参数**: `?period=today` (可选: today / week / month)

**响应** (200):
```json
{
    "merchant_id": "m_abc123",
    "merchant_name": "Café Glockenspiel",
    "period": "today",
    "funnel": {
        "generated": 27,
        "displayed": 21,
        "accepted": 8,
        "redeemed": 5,
        "dismissed": 5,
        "expired": 8
    },
    "rates": {
        "acceptance_rate": 0.38,
        "redemption_rate": 0.63,
        "conversion_rate": 0.24
    },
    "revenue": {
        "total_transaction_value": 22.50,
        "total_discount_given": 3.38,
        "estimated_incremental_revenue": 19.12,
        "cost_per_acquisition": 0.68,
        "roi_percent": 566
    }
}
```

**漏斗逻辑说明**:
- `generated` ≥ `displayed` ≥ (`accepted` + `dismissed` + `expired`)
- `redeemed` ≤ `accepted`
- 这些数字逻辑上是递减的，像漏斗一样

---

### 10. GET `/api/merchants/{id}/feed` — 实时事件流

**用途**: 获取商户的实时活动事件（AI生成/接受/拒绝/核销等）。

**查询参数**: `?limit=20` (默认20条)

**响应** (200):
```json
{
    "merchant_id": "m_abc123",
    "events": [
        {
            "timestamp": "12:20",
            "event_type": "offer_redeemed",
            "icon": "📱",
            "message": "QR已核销 · €4.50 · -€0.68折扣"
        },
        {
            "timestamp": "12:17",
            "event_type": "offer_accepted",
            "icon": "✅",
            "message": "Offer已接受: Cold outside? ☕"
        },
        {
            "timestamp": "12:15",
            "event_type": "offer_generated",
            "icon": "🤖",
            "message": "AI生成Offer: Cold outside? ☕"
        },
        {
            "timestamp": "12:10",
            "event_type": "offer_dismissed",
            "icon": "❌",
            "message": "Offer被拒绝"
        },
        {
            "timestamp": "11:45",
            "event_type": "offer_expired",
            "icon": "⏰",
            "message": "Offer已过期"
        }
    ]
}
```

**event_type可选值**: `offer_generated` / `offer_displayed` / `offer_accepted` / `offer_redeemed` / `offer_dismissed` / `offer_expired`

---

### 11. POST `/api/offers/{id}/redeem` — 扫码核销

**用途**: 商户扫描消费者手机上的QR码，核销offer并自动计算折扣和返现。

**请求体**:
```json
{
    "token": "CW-2025-a1b2c3d4e5f6",
    "transaction_amount": 4.50
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | ✅ | QR码中的token |
| transaction_amount | float | ✅ | 实际消费金额(欧元) |

**响应 — 成功** (200):
```json
{
    "status": "redeemed",
    "offer_id": "offer_abc123",
    "discount_applied": 0.68,
    "cashback_credited": 0.68,
    "wallet_new_balance": 3.24,
    "message": "Enjoy your cappuccino! ☕ €0.68 cashback added."
}
```

**响应 — token无效** (400):
```json
{
    "status": "invalid",
    "message": "Token不存在或已被使用"
}
```

**响应 — 已过期** (400):
```json
{
    "status": "expired",
    "message": "此offer已过期"
}
```

---

## 三、设备端意图引擎（消费者App前端实现）

这部分完全在前端运行，不需要调用后端API。后端只接收抽象的意图结果。

### 输入: GPS位置点（每10秒采集一次）

### 分析逻辑:
```
速度 > 4 km/h + 直线路径 → "commuting"（通勤，不推送offer）
速度 1-3 km/h + 停留2次+ 曲折 → "browsing_food"（午餐时段）
速度 1-3 km/h + 曲折 → "browsing_general"（一般闲逛）
速度 < 0.5 km/h → "stationary"（已在店内，不推送）
```

### 发送给后端的数据（GDPR合规）:
```json
// ✅ 发这个（抽象意图）
{ "user_intent": "browsing_food", "confidence": 0.85, "zone": "marienplatz" }

// ❌ 永远不发原始GPS坐标给后端
```

---

## 四、错误处理

所有错误返回格式:
```json
{
    "detail": "错误描述"
}
```

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求错误（token无效、offer过期等）|
| 404 | 找不到（商户/offer不存在）|
| 500 | 服务器错误 |

---

## 五、如何启动后端

```bash
cd backend
pip install -r requirements.txt        # 安装依赖
python models/seed.py                   # 注入种子数据（慕尼黑商户）
uvicorn main:app --reload               # 启动服务器 localhost:8000
```

启动后访问 `http://localhost:8000/docs` 查看交互式Swagger文档。

---

## 六、数据流总结

### 消费者App流程:
```
设备端intentEngine → POST /api/context → POST /api/offers/generate
    → 用户看到GenUI卡片 → 接受/拒绝
    → POST /api/offers/{id}/accept → 显示QR码
    → 商户扫码 → POST /api/offers/{id}/redeem
    → GET /api/wallet/{user_id} → 返现到账
```

### 商户Dashboard流程:
```
GET /api/merchants → 选择店铺 → GET /api/merchants/{id}
    → PUT /api/merchants/{id}/rules（编辑规则）
    → GET /api/merchants/{id}/analytics（查看漏斗）
    → GET /api/merchants/{id}/feed（实时事件）
    → POST /api/offers/{id}/redeem（扫码核销）
```
