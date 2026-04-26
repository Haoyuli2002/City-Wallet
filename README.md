# 🏙️ City Wallet

**Generative City-Wallet: Hyperpersonalized Offers for Anyone, Anywhere**

An AI-powered city wallet that generates hyper-personalized offers for local merchants in real time.

## Project Structure

```
city-wallet/
├── README.md                  ← You are here
├── README_CN.md               ← Chinese version
├── PRODUCT.md                 ← Product specification
├── API_DOCS.md                ← Frontend/backend API documentation
├── API_DOCS_CN.md             ← API docs (Chinese)
├── .gitignore
│
├── backend/                   ← Backend (Python FastAPI)
│   ├── main.py                   FastAPI entry point
│   ├── config/                   Configuration
│   ├── models/                   Database + data models
│   ├── services/                 Weather / merchants / transactions / context / AI / QR
│   └── api/                      API endpoints
│
├── consumer-app/              ← Consumer App (React/Next.js)
│   └── src/                      Map + GenUI offer cards + QR + wallet
│
├── merchant-dashboard/        ← Merchant Dashboard (React/Next.js)
│   └── src/                      KPI + funnel + rule config + QR scanning
│
└── prototypes/                ← Prototype demos (HTML)
    ├── visualize_merchants.html  Merchant map visualization
    └── merchant_dashboard.html   Merchant dashboard prototype
```

## Quick Start

### Start the Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env           # Fill in API keys
python models/seed.py          # Seed Munich merchant data
uvicorn main:app --reload      # Start at localhost:8000
```

### Start the Consumer App
```bash
cd consumer-app
npm install
npm run dev                    # Start at localhost:3000
```

### Start the Merchant Dashboard
```bash
cd merchant-dashboard
npm install
npm run dev                    # Start at localhost:3001
```

### View Prototypes
```bash
open prototypes/visualize_merchants.html   # Merchant map
open prototypes/merchant_dashboard.html    # Merchant dashboard
```

### View API Docs
After starting the backend, visit: http://localhost:8000/docs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python FastAPI + SQLite |
| AI | OpenAI GPT-4o |
| Weather | OpenWeatherMap API |
| Merchant Data | Google Places API |
| Consumer App | React/Next.js 14 + TypeScript |
| Merchant Dashboard | React/Next.js 14 + TypeScript |

## Required API Keys

1. **OpenAI** — AI offer generation
2. **Google Maps/Places** — Real merchant data + map
3. **OpenWeatherMap** — Real-time weather data

## Team

| Module | Owner |
|--------|-------|
| `backend/` | Backend developer |
| `consumer-app/` + `merchant-dashboard/` | Frontend developers |
