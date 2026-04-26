# 🏙️ City Wallet

**Generative City-Wallet: Hyperpersonalized Offers for Anyone, Anywhere**

AI驱动的城市钱包，为本地商户实时生成超个性化offer。

## 项目结构

```
city-wallet/
├── README.md                  ← 你在这里
├── PRODUCT.md                 ← 产品文档
├── API_DOCS.md                ← 前后端接口文档（13个接口详细说明）
├── .gitignore
│
├── backend/                   ← 后端 (Python FastAPI)
│   ├── main.py                   FastAPI入口
│   ├── config/                   配置
│   ├── models/                   数据库 + 数据模型
│   ├── services/                 天气/商户/交易/上下文/AI/QR
│   └── api/                      API端点
│
├── consumer-app/              ← 消费者App (React/Next.js)
│   └── src/                      地图 + GenUI offer卡片 + QR + 钱包
│
├── merchant-dashboard/        ← 商户Dashboard (React/Next.js)
│   └── src/                      KPI + 漏斗 + 规则配置 + 扫码核销
│
└── prototypes/                ← 原型演示 (HTML)
    ├── visualize_merchants.html  商户地图可视化
    └── merchant_dashboard.html   商户Dashboard原型
```

## 快速开始

### 启动后端
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env           # 填入API Keys
python models/seed.py          # 注入慕尼黑商户数据
uvicorn main:app --reload      # 启动 localhost:8000
```

### 查看原型
```bash
open prototypes/visualize_merchants.html      # 商户地图
open prototypes/merchant_dashboard.html       # 商户Dashboard
```

### 查看API文档
启动后端后访问: http://localhost:8000/docs

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python FastAPI + SQLite |
| AI | OpenAI GPT-4o |
| 天气 | OpenWeatherMap API |
| 商户数据 | Google Places API |
| 消费者App | React/Next.js (队友实现) |
| 商户Dashboard | React/Next.js (队友实现) |

## API Keys 需要

1. **OpenAI** — AI生成offer内容
2. **Google Maps/Places** — 真实商户数据 + 地图
3. **OpenWeatherMap** — 实时天气数据

## 分工

| 模块 | 负责人 |
|------|--------|
| `backend/` | 后端开发 |
| `consumer-app/` + `merchant-dashboard/` | 前端队友 |
