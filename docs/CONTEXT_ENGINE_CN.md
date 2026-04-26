# Context Engine — 上下文感知引擎

## 总结

**收集所有环境信号 → 打包发给GPT-4o → AI决定"要不要给用户推offer，推哪家店"。**

---

## 业务逻辑流程

### 输入（前端发来）

```json
{
    "lat": 48.1371,
    "lon": 11.5754,
    "user_intent": "browsing_food",
    "confidence": 0.85,
    "zone": "marienplatz"
}
```

### 7步处理流程

```
Step 1: 获取实时天气
├── 调用 weather.py → OpenWeatherMap API
├── 返回: 温度、体感温度、天气状况、湿度、风速
├── 10分钟缓存（避免过多API调用）
└── 无API Key时自动回退到模拟数据

Step 2: 分析当前时间
├── 本地计算（不调API）
├── 判定时段: early_morning / morning / lunch_break / afternoon / evening / night
├── 判定日期类型: weekday / weekend
└── 生成可读标签: "Friday Evening"

Step 3: 搜索附近商户
├── 调用 places.py → 从数据库查询500米范围内的商户
├── 数据库里是真实的Google Places数据（seed.py拉取的）
├── 计算每个商户到用户的距离（Haversine公式）
└── 返回商户列表 + 距离

Step 4: 查询每个商户的交易密度
├── 对每个商户调用 transaction_sim.py
├── 查数据库: "当前小时交易量" vs "过去30天同小时平均"
├── 计算 ratio = 当前 / 平均
├── 判定状态:
│   ├── ratio ≤ 0.25 → very_low (非常冷清)
│   ├── ratio ≤ 0.50 → low (冷清)
│   ├── ratio ≤ 1.20 → normal (正常)
│   ├── ratio ≤ 1.80 → busy (忙碌)
│   └── ratio > 1.80 → very_busy (非常忙)
└── 计算 demand_gap = 1 - ratio (0~1, 越高越需要客人)

Step 5: 按冷清程度排序
├── demand_gap 最高的商户排前面
└── 这些商户最需要客人 → 最应该推offer

Step 6: 把所有信号打包发给GPT-4o (核心!)
├── 构建prompt，包含:
│   ├── 天气: "Clouds (14°C, feels like 12°C)"
│   ├── 时间: "Friday Evening (evening, weekday)"
│   ├── 用户行为: "browsing_food (confidence: 0.85)"
│   └── 附近8家商户的详细信息:
│       "1. Café Glockenspiel (cafe) — 80m, ★4.6, demand: very_low (3 tx vs 12 avg)"
│       "2. Hofbräuhaus (restaurant) — 200m, ★4.3, demand: normal"
│       "3. Rischart (bakery) — 120m, ★4.1, demand: low"
│       ...
├── AI分析所有信号的交叉关系
└── AI返回JSON决策:
    {
        "should_trigger": true,          // 要不要推offer
        "confidence": 0.82,              // AI的信心程度
        "best_merchant_index": 0,        // 推荐第几家商户
        "trigger_type": "warm_drink",    // 推什么类型
        "reasoning": "Cold evening...",  // 为什么这么判断
        "suggested_category": "cafe"     // 建议的商户类别
    }

Step 7: 整理输出
├── 把AI推荐的商户排到列表第一位
├── 组装完整的上下文响应
└── 返回给前端
```

---

## GPT-4o 分析的Prompt

```
You are the context analysis engine for City Wallet.
Analyze the following real-time context and decide whether to trigger a personalized offer.

CURRENT CONTEXT:
- Weather: Clouds (14°C, feels like 12°C), overcast clouds
- Time: Friday Evening (evening, weekday)
- User behavior: browsing_food (confidence: 0.85)
- Nearby merchants:
  1. Café Glockenspiel (cafe) — 80m away, ★4.6, demand: very_low (3 tx now vs 12 avg)
  2. Hofbräuhaus München (restaurant) — 200m away, ★4.3, demand: normal (8 tx vs 10 avg)
  3. Rischart (bakery) — 120m away, ★4.1, demand: low (2 tx vs 6 avg)
  ...

RULES:
- Only trigger if the context genuinely suggests the user would benefit from an offer
- "commuting" or "stationary" users should rarely get offers
- Prefer merchants that are quiet AND close AND relevant
- Consider weather-category fit (cold→warm drinks, hot→cold drinks, rain→indoor)
- Consider time-category fit (morning→coffee, lunch→food, evening→drinks/dinner)
```

---

## AI返回的 trigger_type（15种）

| 类型 | 含义 | 典型场景 | 对应商户类型 |
|------|------|----------|-------------|
| `warm_drink` | 热饮 | 冷天(<10°C) + 闲逛 | 咖啡馆 |
| `cold_drink` | 冷饮/冰品 | 热天(>28°C) | 冰淇淋店/咖啡馆 |
| `breakfast` | 早餐 | 早晨(7:00-10:00) + 闲逛 | 面包店/咖啡馆 |
| `quick_meal` | 快餐/午餐 | 午餐时段(11:30-14:00) + 找吃 | 餐厅 |
| `snack` | 小吃/甜点 | 下午(14:00-17:00) | 面包店/甜品店 |
| `afternoon_tea` | 下午茶 | 下午 + 冷清的咖啡馆 | 咖啡馆/面包店 |
| `dinner` | 晚餐 | 傍晚(17:00-20:00) + 找吃 | 餐厅 |
| `evening_out` | 晚间社交 | 晚上(20:00+) + 周五/周六 | 酒吧/餐厅 |
| `happy_hour` | 欢乐时光特惠 | 16:00-19:00 + 酒吧冷清 | 酒吧 |
| `weekend_brunch` | 周末早午餐 | 周末 + 上午 | 咖啡馆/餐厅 |
| `shelter` | 避雨/取暖 | 下雨/大风天 | 室内任何店 |
| `fresh_bread` | 新鲜出炉 | 早上 + 面包店冷清 | 面包店 |
| `rainy_day_read` | 雨天阅读 | 下雨 + 书店附近 | 书店 |
| `browse` | 一般逛逛/消磨时间 | 任何时段 + 一般闲逛 | 书店/商店 |
| `none` | 不推offer | 通勤/跑步/不适合推送 | 无 |

---

## 输出（返回给前端）

```json
{
    "weather": {
        "temp": 14.2,
        "feels_like": 12.1,
        "condition": "Clouds",
        "description": "overcast clouds",
        "humidity": 68,
        "wind_speed": 3.5,
        "icon": "☁️",
        "trigger": "nice"
    },
    "time": {
        "current": "2025-04-25T23:48:00",
        "slot": "night",
        "day_type": "weekday",
        "label": "Friday Night"
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
            "distance_m": 80,
            "rating": 4.6,
            "tx_density": {
                "current_hour": 3,
                "avg_hour": 12,
                "status": "very_low",
                "demand_gap": 0.75
            }
        }
    ],
    "composite_trigger": "warm_drink",
    "trigger_score": 0.82,
    "ai_analysis": {
        "should_trigger": true,
        "reasoning": "Cold evening, user browsing for food, Café Glockenspiel is very quiet and just 80m away",
        "suggested_category": "cafe"
    }
}
```

---

## 前端怎么用这个数据

```javascript
const context = await fetch("POST /api/context", { lat, lon, user_intent });

if (context.ai_analysis.should_trigger) {
    // AI说要推offer → 调用offer生成
    const offer = await fetch("POST /api/offers/generate", {
        lat, lon,
        merchant_id: context.nearby_merchants[0].id  // AI推荐的商户(已排第一)
    });
    showOfferCard(offer);  // 用GenUI渲染
} else {
    // AI说不推 → 安静等待，30秒后再检查
    console.log("Reason:", context.ai_analysis.reasoning);
}
```

---

## 为什么用GPT-4o而不是硬编码规则

| | 硬编码规则 | GPT-4o分析 |
|---|---|---|
| **复杂度** | if/else越写越多 | 一个prompt解决 |
| **交叉判断** | "冷天+午餐+咖啡馆冷清" 需要写很多组合 | AI自然理解语义关系 |
| **新场景** | 每个新场景要加代码 | AI自动适配 |
| **可解释性** | 不知道为什么分数是0.7 | AI给出reasoning |
| **调优** | 改权重要改代码 | 改prompt就行 |
| **成本** | 免费 | ~$0.005/次 |

---

## Fallback机制

如果GPT-4o不可用（API故障/超时/key过期），自动回退到简单规则：

```python
def _fallback_analysis():
    if user_intent == "commuting":
        return should_trigger = False
    if user_intent in ("browsing_food", "browsing_general") and merchants:
        return should_trigger = True, trigger_type = "warm_drink" if cold else "quick_meal"
```

确保系统永远不会因为AI故障而完全不工作。