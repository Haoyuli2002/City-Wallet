# 🏙️ City Wallet

**Generative City-Wallet: Hyperpersonalized Offers for Anyone, Anywhere**

> DSV-Gruppe · MIT Hackathon Challenge 01

---

## Table of Contents

1. [What Is City Wallet?](#what-is-city-wallet)
2. [Unique Selling Points](#unique-selling-points)
3. [How to Run](#how-to-run)
4. [Don't Want to Run It? Read the Demos](#dont-want-to-run-it-read-the-demos)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)

---

## What Is City Wallet?

City Wallet is an AI-powered city wallet that connects local merchants with nearby consumers through hyper-personalized, real-time offers — generated from scratch for each user, at each moment, by GPT-4o.

**The consumer side — Mia's story:**
Mia is walking through Munich at 12:15 on a cold Tuesday, slightly hungry, 12 minutes to spare. A café 80 meters away has had only 3 customers all morning. City Wallet detects the moment, generates an offer tailored to her context, and puts it in her hand. She walks in. The café fills a quiet hour.

**The merchant side — Thomas's story:**
Thomas runs Bakery Zöttl. He spent 3 minutes setting up City Wallet — max 15% discount, target: fill quiet hours. That's it. The AI monitors demand in real time, generates offers autonomously, and sends them to nearby users when conditions are right. Thomas didn't run a campaign. He just opened his door.

---

## Unique Selling Points

**1. Offers don't exist until the moment they are needed.**
Every offer is generated from scratch by GPT-4o based on live context — weather, time, user intent, merchant demand. No templates. No pre-written copy. A new offer, for this person, at this second.

**2. AI context-aware recommendation system.**
The system aggregates 5 real-time signals — live weather (OpenWeatherMap), time slot, on-device user intent (JavaScript), nearby merchant density (Google Places), and transaction demand gaps (Payone simulation) — into a composite trigger score. When it exceeds 0.7, GPT-4o is invoked. The right merchant is recommended to the right user at the right moment — not through purchase history, but through live context.

**3. Dynamic pricing driven by real demand.**
The discount percentage is not fixed. The AI reads live transaction density and sets the discount accordingly — higher when the merchant is quiet, lower at peak hours. The merchant only sets a maximum cap. The AI optimises in real time.

**4. Privacy by design, not by policy.**
All GPS behavior analysis runs on-device in JavaScript. Raw coordinates never leave the phone. Only an abstract intent signal — `"browsing_food"` — is transmitted. GDPR-compliant by architecture.

**5. Zero effort for merchants.**
One setup: a few rules. The AI writes the copy, decides the discount, picks the visual theme, and times the offer autonomously. No campaign management. No marketing expertise required. Total setup time: under 3 minutes.

---

## How to Run

### Prerequisites
- Python 3.11+, Node.js 18+
- API keys: OpenAI, Google Maps/Places, OpenWeatherMap

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Add your API keys
python models/seed.py       # Seed Munich merchant data
uvicorn main:app --reload   # Runs at http://localhost:8000
```

### 2. Start the Consumer App
```bash
cd consumer-app
npm install
npm run dev                 # Runs at http://localhost:3000
```

### 3. Start the Merchant Dashboard
```bash
cd merchant-dashboard
npm install
npm run dev                 # Runs at http://localhost:3001
```

### 4. API Documentation
Interactive Swagger UI: http://localhost:8000/docs

---

## Don't Want to Run It? Read the Demos.

> **[→ Consumer Demo: Mia's Story](DEMO_Consumer.md)**
> Follow Mia through context sensing, merchant exploration, AI offer generation, QR redemption, and cashback.

> **[→ Merchant Demo: Thomas's Story](DEMO_Merchant.md)**
> Follow Thomas (Bakery Zöttl) through store setup, AI rule configuration, QR scanning, and performance analytics.

> **[→ Full Demo Walkthrough](DEMO.md)**
> Complete end-to-end walkthrough with all screenshots.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI · SQLite (aiosqlite) |
| AI | OpenAI GPT-4o — offer generation + dynamic pricing |
| Context | OpenWeatherMap · Google Places API · Payone simulation |
| Consumer App | Next.js 14 · TypeScript · On-device intent engine |
| Merchant Dashboard | Next.js 14 · TypeScript · Real-time analytics |
| Privacy | On-device GPS analysis — no raw coordinates transmitted |

---

## Project Structure

```
City Wallet/
├── README.md               ← You are here
├── DEMO_Consumer.md        ← Consumer demo (Mia's story)
├── DEMO_Merchant.md        ← Merchant demo (Thomas's story)
├── DEMO.md                 ← Full walkthrough
├── backend/                ← Python FastAPI (16 endpoints)
├── consumer-app/           ← Next.js consumer app (localhost:3000)
├── merchant-dashboard/     ← Next.js merchant dashboard (localhost:3001)
├── Demo/                   ← Screenshots
└── docs/                   ← Technical documentation
```

---

*Three modules. Two interfaces. One living wallet.*
