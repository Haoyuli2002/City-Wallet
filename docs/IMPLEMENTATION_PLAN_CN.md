# 🛠️ CITY WALLET — 实现计划

## 概览

| 项目 | 详情 |
|------|------|
| **总文件数** | ~30个文件 |
| **后端** | Python FastAPI + SQLite |
| **前端** | Next.js 14 + Tailwind CSS |
| **外部API** | OpenAI GPT-4o + Google Places + OpenWeatherMap |

---

## 项目文件结构

```
city-wallet/
├── PRODUCT.md                          ✅ 已完成
├── IMPLEMENTATION_PLAN.md              ✅ 本文件
│
├── backend/
│   ├── .env.example                    ✅ 已完成
│   ├── requirements.txt                ✅ 已完成
│   ├── main.py                         📝 阶段2
│   ├── config/
│   │   ├── settings.py                 ✅ 已完成
│   │   └── cities/stuttgart.json       📝 阶段1
│   ├── models/
│   │   ├── database.py                 📝 阶段1 — 数据库建表
│   │   ├── schemas.py                  📝 阶段1 — Pydantic数据模型
│   │   └── seed.py                     📝 阶段1 — 种子数据
│   ├── services/
│   │   ├── weather.py                  📝 阶段3 — 天气API
│   │   ├── places.py                   📝 阶段3 — Google Places
│   │   ├── transaction_sim.py          📝 阶段3 — 模拟Payone交易
│   │   ├── context_engine.py           📝 阶段4 — 上下文聚合
│   │   ├── ai_generator.py             📝 阶段5 — AI生成Offer
│   │   └── qr_service.py              📝 阶段6 — QR码生成
│   └── api/
│       ├── context.py                  📝 阶段4 — 上下文API
│       ├── offers.py                   📝 阶段5 — Offer API
│       ├── redeem.py                   📝 阶段6 — 核销API
│       └── merchants.py               📝 阶段6 — 商户API
│
├── frontend/
│   ├── package.json                    📝 阶段7
│   ├── next.config.js                  📝 阶段7
│   ├── tailwind.config.js              📝 阶段7
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              📝 阶段7 — 根布局
│       │   ├── page.tsx                📝 阶段8 — 消费者首页
│       │   ├── offer/[id]/page.tsx     📝 阶段9 — Offer详情
│       │   ├── checkout/[id]/page.tsx  📝 阶段9 — QR结算
│       │   ├── wallet/page.tsx         📝 阶段9 — 钱包
│       │   └── merchant/
│       │       ├── page.tsx            📝 阶段10 — 商户Dashboard
│       │       ├── rules/page.tsx      📝 阶段10 — 规则配置
│       │       ├── analytics/page.tsx  📝 阶段10 — 数据分析
│       │       └── scan/page.tsx       📝 阶段10 — 扫码核销
│       ├── components/
│       │   ├── ContextBar.tsx          📝 阶段8 — 上下文状态栏
│       │   ├── OfferCard.tsx           📝 阶段8 — GenUI动态卡片
│       │   ├── MapView.tsx             📝 阶段8 — Google地图
│       │   ├── QRCodeDisplay.tsx       📝 阶段9 — QR码展示
│       │   ├── WalletView.tsx          📝 阶段9 — 钱包组件
│       │   ├── MerchantDashboard.tsx   📝 阶段10 — 商户总览
│       │   ├── RulesForm.tsx           📝 阶段10 — 规则表单
│       │   ├── AnalyticsCharts.tsx     📝 阶段10 — 图表
│       │   └── QRScanner.tsx           📝 阶段10 — 扫码器
│       ├── lib/
│       │   ├── api.ts                  📝 阶段7 — API客户端
│       │   └── intentEngine.ts         📝 阶段11 — 行为意图引擎
│       └── hooks/
│           ├── useLocation.ts          📝 阶段8 — 定位Hook
│           └── useIntent.ts            📝 阶段11 — 意图Hook
│
└── README.md                           📝 阶段12
```

---

## 阶段1：数据库与数据模型

### 目标
搭建数据基础层，创建7张表 + 数据验证模型 + 斯图加特演示数据。

### 文件清单

| 文件 | 职责 | 核心内容 |
|------|------|----------|
| `models/database.py` | 数据库初始化 | 7张表的CREATE TABLE语句，`init_db()`和`get_db()`函数 |
| `models/schemas.py` | 数据验证 | Pydantic模型：请求/响应的类型定义 |
| `models/seed.py` | 演示数据 | 10-15个斯图加特商户 + 默认规则 + 48小时模拟交易 |
| `config/cities/stuttgart.json` | 城市配置 | 斯图加特坐标、搜索半径、时区、商户类别 |

### 7张数据库表

```
1. merchants              — 商户基本信息（名字、位置、评分、照片）
2. merchant_rules         — 商户AI规则（最大折扣、目标、调性、预算）
3. simulated_transactions — 模拟Payone交易流（用于判断商户忙不忙）
4. offers                 — AI生成的Offer（完整生命周期追踪）
5. redemptions            — 核销记录（QR token、交易金额、返现）
6. wallet                 — 用户钱包余额
7. wallet_transactions    — 钱包流水（每笔返现/支出）
```

### 验证标准
```bash
python models/seed.py
sqlite3 city_wallet.db "SELECT count(*) FROM merchants;"  # 应返回 10+
sqlite3 city_wallet.db "SELECT count(*) FROM simulated_transactions;"  # 应返回 200+
```

---

## 阶段2：FastAPI 服务器入口

### 目标
API服务器能启动，健康检查能响应。

### 文件清单

| 文件 | 职责 | 核心内容 |
|------|------|----------|
| `main.py` | 应用入口 | FastAPI实例、CORS、路由注册、启动时初始化数据库 |

### 验证标准
```bash
uvicorn main:app --reload
# GET http://localhost:8000/api/health → {"status": "ok"}
# GET http://localhost:8000/docs → Swagger文档页
```

---

## 阶段3：外部服务集成

### 目标
对接三个外部数据源：天气、商户、交易密度。

### 文件清单

| 文件 | 职责 | 数据来源 | 核心函数 |
|------|------|----------|----------|
| `services/weather.py` | 实时天气 | OpenWeatherMap API | `get_weather(lat, lon)` → 温度/体感/天气状况/湿度 |
| `services/places.py` | 真实商户 | Google Places API | `search_nearby(lat, lon)` → 附近商户列表+评分+照片 |
| `services/transaction_sim.py` | 交易密度 | 自动模拟 | `get_current_density(merchant_id)` → 忙闲状态 |

### 关键设计
- **天气**: 10分钟缓存，避免过多API调用；无API Key时自动回退到模拟数据
- **商户**: 30分钟缓存；返回真实的Google数据（名字、评分、照片URL）
- **交易密度**: 模拟真实模式（午餐高峰、下午低谷、傍晚高峰），随机波动±30%

### 验证标准
```bash
python -c "from services.weather import get_weather; import asyncio; print(asyncio.run(get_weather(48.77, 9.18)))"
# 应返回斯图加特真实天气数据
```

---

## 阶段4：上下文感知与聚合

### 目标
把所有信号（天气+时间+位置+交易密度+用户意图）合成一个统一的上下文状态。

### 文件清单

| 文件 | 职责 | 核心函数 |
|------|------|----------|
| `services/context_engine.py` | 上下文聚合 | `build_context(lat, lon, intent, zone)` → 完整上下文状态 |
| `api/context.py` | 上下文API | `POST /api/context` — 返回聚合后的上下文 |

### 触发逻辑（组合判断）

| 组合条件 | 触发标签 | 分数 |
|----------|----------|------|
| 冷天 + 闲逛找吃 + 咖啡馆冷清 | `warm_drink_opportunity` | 0.9+ |
| 热天 + 闲逛 + 冰淇淋店冷清 | `cool_treat_opportunity` | 0.85+ |
| 下雨 + 任何意图 + 室内店冷清 | `shelter_opportunity` | 0.8+ |
| 午餐时段 + 找吃 + 餐厅冷清 | `quick_lunch_opportunity` | 0.9+ |
| 通勤模式 | `no_trigger` | 0.0 |

### 验证标准
```bash
curl -X POST http://localhost:8000/api/context \
  -d '{"lat": 48.7758, "lon": 9.1829, "user_intent": "browsing_food", "zone": "altstadt"}'
# 应返回完整上下文，包含 trigger_score > 0
```

---

## 阶段5：AI Offer 生成引擎

### 目标
GPT-4o 根据上下文 + 商户规则动态生成个性化Offer。

### 文件清单

| 文件 | 职责 | 核心函数 |
|------|------|----------|
| `services/ai_generator.py` | AI生成 | `generate_offer(context, merchant, rules)` → 完整Offer数据 |
| `api/offers.py` | Offer API | 生成/查询/接受/拒绝 5个端点 |

### AI生成内容（全部动态，非模板）
- 📝 标题（情感化，最多6个词）
- 📝 副标题（一句话，情境化）
- 💰 折扣百分比（在商户最大值范围内）
- 🎨 主色/背景色/强调色（根据mood）
- 😊 情绪（cozy/warm/cool/energetic/fresh）
- ☕ 图标（emoji）
- 🔘 按钮文本
- ⏱️ 有效时间（分钟）
- 🧠 推理说明（为什么这个offer适合这个时刻）

### API端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/api/offers/generate` | AI生成新offer |
| GET | `/api/offers/{id}` | 获取offer详情 |
| GET | `/api/offers/active` | 用户当前活跃offers |
| POST | `/api/offers/{id}/accept` | 用户接受（生成QR码） |
| POST | `/api/offers/{id}/dismiss` | 用户拒绝 |

### 验证标准
```bash
curl -X POST http://localhost:8000/api/offers/generate -d '{...}'
# 应返回AI生成的offer，包含headline, discount, colors等
```

---

## 阶段6：核销系统 + 商户API

### 目标
QR码闭环 + 商户Dashboard数据。

### 文件清单

| 文件 | 职责 | 核心函数 |
|------|------|----------|
| `services/qr_service.py` | QR码管理 | `create_token()`, `generate_qr()`, `validate_token()` |
| `api/redeem.py` | 核销API | 扫码核销 + 钱包查询 |
| `api/merchants.py` | 商户API | 商户列表/详情/规则更新/分析数据/事件流 |

### 核销流程
```
用户接受offer → 生成唯一token (CW-2025-abc123)
→ 生成QR码图片（base64） → 前端展示
→ 商户扫码 → 后端验证token → 计算折扣
→ 确认核销 → 返现到钱包 → 更新Dashboard
```

### 商户API端点

| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/merchants` | 商户列表 |
| GET | `/api/merchants/{id}` | 商户详情+规则 |
| PUT | `/api/merchants/{id}/rules` | 更新AI规则 |
| GET | `/api/merchants/{id}/analytics` | 漏斗数据+收入 |
| GET | `/api/merchants/{id}/feed` | 实时事件流 |

### 验证标准
完整端到端测试：生成offer → 接受 → 获取QR → 核销 → 钱包余额增加 → 商户数据更新

---

## 阶段7：前端项目初始化

### 目## 阶段7：前端项目初始化

### 目标
Next.js应用能启动，能调用后端API。

### 文件清单

| 文件 | 职责 |
|------|------|
| `package.json` | 依赖管理：next, react, tailwindcss, @react-google-maps/api, recharts, qrcode.react, html5-qrcode |
| `next.config.js` | API代理到后端 `localhost:8000` |
| `tailwind.config.js` | Tailwind配置 |
| `src/app/layout.tsx` | 根布局：导航栏 + 消费者/商户切换 |
| `src/lib/api.ts` | API客户端：封装所有后端请求 |
| `public/manifest.json` | PWA配置（可安装到手机主屏幕） |

### 验证标准
```bash
cd frontend && npm install && npm run dev
# http://localhost:3000 → 显示基础布局
```

---

## 阶段8：消费者首页

### 目标
地图 + 上下文状态栏 + AI动态Offer卡片。

### 文件清单

| 文件 | 职责 |
|------|------|
| `src/app/page.tsx` | 消费者主页面 |
| `src/components/MapView.tsx` | Google地图 + 商户标记 + 用户位置 |
| `src/components/ContextBar.tsx` | 顶部：☁️ 11°C · Tue 12:15 · 🚶 Browsing |
| `src/components/OfferCard.tsx` | GenUI动态卡片（颜色/图标/文案全由AI决定） |
| `src/hooks/useLocation.ts` | 浏览器GPS定位Hook |

### 核心交互
1. 打开App → 请求定位授权 → 获取GPS
2. 地图居中到用户位置 → 标记附近商户
3. 自动获取上下文 → 如果trigger_score > 0.7 → 生成offer
4. Offer卡片从底部滑入 → 3秒内可理解（图标→标题→距离+折扣→按钮）
5. 用户可接受/拒绝/等待过期

### 验证标准
- 手机浏览器打开 → 看到地图 + 上下文栏 + 至少一张offer卡片
- 卡片颜色和mood与AI输出一致

---

## 阶段9：消费者 — 详情 + 结算 + 钱包

### 目标
完成消费者端完整交易流。

### 文件清单

| 文件 | 职责 |
|------|------|
| `src/app/offer/[id]/page.tsx` | Offer详情：商户照片 + 完整描述 + 地图 |
| `src/app/checkout/[id]/page.tsx` | QR码 + 倒计时 + "到店出示" |
| `src/app/wallet/page.tsx` | 余额 + 返现历史列表 |
| `src/components/QRCodeDisplay.tsx` | 大QR码 + mm:ss倒计时 |
| `src/components/WalletView.tsx` | 余额卡片 + 交易流水 |

### 交互设计
- **接受**: 卡片展开 → QR码出现 → 倒计时开始
- **拒绝**: 左滑 → 淡出 → "Not your vibe? Got it."
- **过期**: 倒计时归零 → 柔和模糊 → "Gone, but we'll find another"
- **钱包**: 显示余额 + 每笔返现记录（时间、商户、金额）

---

## 阶段10：商户端 — Dashboard + 规则 + 分析 + 扫码

### 目标
完整的商户管理界面。

### 文件清单

| 文件 | 职责 |
|------|------|
| `src/app/merchant/page.tsx` | Dashboard主页：关键指标 + 实时事件流 |
| `src/app/merchant/rules/page.tsx` | 规则配置表单 |
| `src/app/merchant/analytics/page.tsx` | 漏斗图 + 收入图 + 历史记录 |
| `src/app/merchant/scan/page.tsx` | 摄像头扫码 + 核销确认 |
| `src/components/MerchantDashboard.tsx` | 指标卡片 + 实时Feed |
| `src/components/RulesForm.tsx` | 规则编辑表单 |
| `src/components/AnalyticsCharts.tsx` | Recharts漏斗/柱状图 |
| `src/components/QRScanner.tsx` | html5-qrcode摄像头扫码 |

### Dashboard核心指标
```
📤 推送数 → 👁️ 阅读数 → ✅ 接受数 → 📱 核销数
接受率 / 核销率 / 转化率
收入总额 / 折扣总额 / 净增量 / ROI
```

### 实时Feed（事件流）
```
12:20 📱 QR已核销 · €4.50 · -€0.68折扣 ✅
12:17 ✅ Offer被接受（女性, 25-30岁）
12:15 🤖 AI生成Offer: "Cold outside? ☕"
12:10 ❌ Offer被拒绝
11:45 ⏰ Offer过期
```

### 规则配置（简单易操作）
- 最大折扣: 下拉选择 5%/10%/15%/20%
- 目标: 下拉选择
- 产品范围: 复选框
- 品牌调性: 下拉选择
- 每日预算: 数字输入
- 暂停/恢复按钮

---

## 阶段11：行为意图引擎（前端）

### 目标
在用户设备上分析GPS轨迹，推断行为意图，保护隐私。

### 文件清单

| 文件 | 职责 |
|------|------|
| `src/lib/intentEngine.ts` | 轨迹分析核心逻辑 |
| `src/hooks/useIntent.ts` | React Hook封装 |

### 分析指标

| 指标 | 通勤 | 闲逛 | 找吃的 |
|------|------|------|--------|
| 速度 | >4 km/h | 1-3 km/h | <2 km/h |
| 停留次数 | 0-1 | 2+ | 频繁 |
| 方向变化 | 小（直线） | 大（曲折） | 中等 |

### 意图分类
- `commuting` → 不推送
- `browsing_general` → 推送附近offers
- `browsing_food` → 优先推送餐饮
- `stationary` → 可能已在店内，不推送

### GDPR关键点
- 所有计算在浏览器本地完成
- 只发送 `{ intent: "browsing_food", zone: "altstadt" }` 给后端
- 不发送原始GPS坐标

---

## 阶段12：最终打磨

### 目标
Demo准备 + 文档 + 清理。

### 文件清单

| 文件 | 职责 |
|------|------|
| `README.md` | 项目介绍 + 安装运行指南 + 演示说明 |

### Demo脚本（两个窗口并排）

**左边（消费者 Mia）**:
1. App打开 → 斯图加特老城地图
2. 上下文栏: "☁️ 11°C · Tue 12:15 · 🚶 Browsing"
3. Offer卡片滑入（AI生成的暖色调咖啡offer）
4. 点击 "Warm Up Now"
5. QR码 + 倒计时
6. 模拟核销 → 返现到钱包

**右边（商户 Café Scholz）**:
1. Dashboard显示今日数据
2. 实时Feed: "🤖 Offer已生成"
3. 实时Feed: "✅ Offer被接受"
4. 实时Feed: "📱 QR已核销"
5. 漏斗图更新
6. 规则面板可调整

---

## 开发顺序总结

```
阶段1 → 阶段2 → 阶段3 → 阶段4 → 阶段5 → 阶段6 → 阶段7 → 阶段8 → 阶段9 → 阶段10 → 阶段11 → 阶段12
数据库    服务器    外部API    上下文     AI引擎    核销     前端初始化  消费者首页  消费者交易  商户端     意图引擎   打磨

|←──────── 后端 (Phase 1-6) ──────────→|←──────── 前端 (Phase 7-11) ──────────→| 最终
```

**后端完成 = 16个API端点全部可用**
**前端完成 = 消费者5个页面 + 商户4个页面**
**总计 = 约30个文件**