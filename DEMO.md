# 🏙️ City Wallet — Demo Walkthrough

## The Scenario

**Mia** is 28, walking through Munich's city center on a Tuesday lunch break. 12 minutes to spare. A café 80m away has been quiet all morning. City Wallet connects these two facts — in real time.

---

## Consumer App — User Flow

### 1. Context Page — Real-Time Environment Sensing

![Context Page 1](Demo/Consumer-App/Consumer_Context_Page_1.png)

The app opens and immediately reads Mia's environment. Live weather data from OpenWeatherMap, current time slot, and nearby merchant density are aggregated into a single context view.

---

![Context Page 2](Demo/Consumer-App/Consumer_Context_Page_2.png)

The context panel shows the full signal breakdown: temperature, conditions, time of day, and nearby partners within 200m — all in real time.

---

![Context Page 3 — User Intent](Demo/Consumer-App/Consumer_Context_Page_3_User_Intent.png)

On-device behavior analysis classifies Mia's movement pattern as **"browsing"** — slow walking speed, two stops in the last 10 minutes, high direction variance. This intent signal is derived entirely on-device. **No raw GPS is ever transmitted** — only the abstract result.

---

### 2. Explore Page — Nearby Merchants

![Explore Page 1](Demo/Consumer-App/Consumer_Explore_Page_1.png)

The Explore tab shows real merchants pulled from Google Places within 500m of Mia's location, ranked by a composite score combining distance, rating, and current demand gap.

---

![Explore Page 2 — Merchant Detail](Demo/Consumer-App/Consumer_Explore_Page_2_One_Merchant_Example.png)

Mia taps a merchant to see details — real name, category, rating, address, and live transaction density. The AI has already identified this café as quiet right now, making it a strong candidate for an offer.

---

![Explore Page 3 — AI-Generated Offer](Demo/Consumer-App/Consumer_Explore_Page_3_Offer_from_Merchant.png)

The system triggers offer generation. **GPT-4o** receives the full context state and the merchant's rules, and generates a unique offer from scratch — headline, discount, colors, icon, and CTA — tailored to this exact moment. The offer didn't exist five minutes ago.

**Dynamic Pricing:** The discount percentage is not fixed — it is determined by the AI at generation time based on live demand signals, distances between customers and merchants, weather, etc. For example, when a merchant's transaction density is very low (e.g. only 3 transactions vs. a 12-transaction average), the AI pushes a higher discount to maximise footfall. During busier periods, it selects a lower discount, preserving margin. The merchant sets only a maximum cap — the AI optimises within that range in real time. This is demand-responsive pricing, not a static coupon.

---

### 3. Offers Page — Active QR Codes

![Offers Page 1](Demo/Consumer-App/Consumer_Offers_Page_1.png)

Mia accepts the offer. It appears in her **My Offers** list alongside any other active offers. Each card shows the merchant, headline, discount, and a countdown timer.

---

![Offers Page 2 — QR Code](Demo/Consumer-App/Consumer_Offers_Page_2_Example_QR_Code.png)

Tapping the card reveals the **QR code** — a unique redemption token valid for the duration shown. Mia walks to the café and shows this screen. Once the merchant scans it, the offer is redeemed and the card disappears from this list automatically.

---

### 4. Wallet Page — Cashback Balance

![Wallet Page](Demo/Consumer-App/Consumer_Wallet_Page_1.png)

After redemption, the cashback is credited to Mia's **City Wallet**. The wallet page shows her running balance and full transaction history — every redemption, every cashback, in one place.

---

## Summary

| Step | What happens |
|------|-------------|
| Context sensing | Live weather + time + GPS intent analyzed on-device |
| Merchant discovery | Real Google Places data, ranked by demand gap |
| Offer generation | GPT-4o creates a unique offer for this exact moment |
| Dynamic pricing | Discount % set by AI based on live demand — higher when quiet, lower at peak |
| Redemption | QR token validated by merchant, cashback credited |
| Wallet | Running balance and history tracked per user |

**Three modules. One seamless flow. Zero marketing effort from the merchant.**

---

## Merchant App — Dashboard Flow

### 1. Merchant Selection

![Merchant Selection](Demo/Merchant-App/Merchant_Selection_Page.png)

The merchant logs into City Wallet and selects their store from a list populated by real Google Places data. Both Munich and Stuttgart merchants are supported. Once selected, the store is remembered for the session.

---

### 2. Discount Rules Configuration

![Discount Rules Page 1](Demo/Merchant-App/Merchant_Discount_Rules_Page_1.png)

The merchant configures the AI rules that govern all offer generation. This is the **only setup step required**. The merchant sets their target goal — for example, "fill quiet hours" — and the maximum discount they are willing to offer.

---

![Discount Rules Page 2](Demo/Merchant-App/Merchant_Discount_Rules_Page_2.png)

Additional rule parameters: product scope (which items the offer applies to), brand tone (cozy, professional, energetic), and daily budget cap. The AI uses all of these as constraints when generating offers — it will never exceed the max discount or the daily budget.

---

![Discount Rules Page 3](Demo/Merchant-App/Merchant_Discount_Rules_Page_3.png)

The merchant can also set active hours and pause or resume offer generation at any time. Changes take effect immediately — the next offer generated will respect the updated rules. No campaign management. No marketing expertise required.

---

### 3. QR Code Scanning & Redemption

![Scan QR Code](Demo/Merchant-App/Merchant_Scan_QR_Code_Page_1.png)

When a customer arrives with a QR code, the merchant opens the Scanner tab. The token can be entered manually. The merchant inputs the transaction amount and confirms.

---

![QR Code Redemption Success](Demo/Merchant-App/Merchant_QR_Code_Redemption_Page_1.png)

The backend validates the token in real time. On success, the screen confirms the discount applied and the cashback credited to the customer's wallet. The merchant sees only the transaction-level details — no personal data, no wallet balance. Once redeemed, the QR code is invalidated and cannot be used again.

---

### 4. Performance Analysis

![Performance Analysis Page 1](Demo/Merchant-App/Merchant_Performance_Analysis_Page_1.png)

The Performance tab shows the complete **offer funnel** for today, this week, or this month: how many offers were pushed, viewed, accepted, and redeemed. Below the funnel, conversion rates are displayed at a glance — acceptance rate, redemption rate, and overall conversion.

---

![Performance Analysis Page 2](Demo/Merchant-App/Merchant_Performance_Analysis_Page_2.png)

The revenue breakdown shows total transaction value generated through City Wallet offers, total discount given, net incremental revenue, and cost per acquisition. The **live event feed** at the bottom updates in real time — every offer generated, accepted, or redeemed appears as a timestamped entry.

---

## End-to-End Summary

| Actor | Step | What happens |
|-------|------|-------------|
| Merchant | Configure rules | Set max discount, target, tone, budget — once |
| Consumer | Open app | Context sensed: weather, time, intent, nearby merchants |
| System | Score context | Composite trigger score calculated in real time |
| System | Generate offer | GPT-4o creates unique offer with dynamic pricing |
| Consumer | Accept offer | QR token generated, countdown starts |
| Consumer | Walk to merchant | Show QR code at counter |
| Merchant | Scan QR | Token validated, discount applied |
| Consumer | Receive cashback | Balance updated in City Wallet |
| Merchant | View analytics | Funnel, revenue, and live feed updated instantly |

**Three modules. Two interfaces. One living wallet.**
