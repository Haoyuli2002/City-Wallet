const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  photo_url?: string;
}

export interface MerchantRules {
  merchant_id: string;
  max_discount_percent: number;
  target: string;
  product_scope: string[];
  brand_tone: string;
  daily_budget_eur: number;
  budget_spent_today: number;
  is_active: boolean;
}

export interface OfferFunnel {
  generated: number;
  displayed: number;
  accepted: number;
  redeemed: number;
  dismissed: number;
  expired: number;
}

export interface AnalyticsData {
  merchant_id: string;
  merchant_name: string;
  period: string;
  funnel: OfferFunnel;
  rates: {
    acceptance_rate: number;
    redemption_rate: number;
    conversion_rate: number;
  };
  revenue: {
    total_transaction_value: number;
    total_discount_given: number;
    estimated_incremental_revenue: number;
    cost_per_acquisition: number;
    roi_percent: number;
  };
}

export interface FeedEvent {
  timestamp: string;
  event_type: string;
  icon: string;
  message: string;
}

export async function getMerchants(city?: string): Promise<Merchant[]> {
  const url = city ? `${API_BASE}/merchants?city=${city}` : `${API_BASE}/merchants`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch merchants");
  return res.json();
}

export async function getMerchant(id: string): Promise<{ merchant: Merchant; rules: MerchantRules }> {
  const res = await fetch(`${API_BASE}/merchants/${id}`);
  if (!res.ok) throw new Error("Failed to fetch merchant");
  return res.json();
}

export async function getAnalytics(id: string, period = "today"): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/merchants/${id}/analytics?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function getFeed(id: string): Promise<{ merchant_id: string; events: FeedEvent[] }> {
  const res = await fetch(`${API_BASE}/merchants/${id}/feed?limit=20`);
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function updateRules(id: string, rules: Partial<MerchantRules>): Promise<{ status: string; rules: MerchantRules }> {
  const res = await fetch(`${API_BASE}/merchants/${id}/rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rules),
  });
  if (!res.ok) throw new Error("Failed to update rules");
  return res.json();
}

export async function redeemOffer(token: string, amount: number) {
  const res = await fetch(`${API_BASE}/offers/unknown/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, transaction_amount: amount }),
  });
  return res.json();
}
