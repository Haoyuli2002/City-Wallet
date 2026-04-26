const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY || "AIzaSyBHpj6gdFSAMnuUTVqZavxu_9xNa5ujpek";

export { MAPS_KEY };

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lon: number;
  rating: number;
  photo_url?: string;
  city?: string;
  distance_m?: number;
}

export interface OfferContent {
  headline: string;
  subtext: string;
  discount_percent: number;
  original_item?: string;
  cta_text: string;
  mood: string;
  color_primary: string;
  color_background: string;
  color_accent: string;
  icon: string;
  valid_minutes: number;
  reasoning: string;
}

export interface OfferResponse {
  id: string;
  merchant: Merchant;
  content: OfferContent;
  status: string;
  created_at: string;
  expires_at: string;
  qr_code?: string;
  token?: string;
}

export async function getMerchants(city?: string): Promise<Merchant[]> {
  const url = city ? `${API}/merchants?city=${city}` : `${API}/merchants`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch merchants");
  return res.json();
}

export async function generateOffer(params: {
  lat: number; lon: number;
  merchant_id: string;
  user_intent?: string;
  user_id?: string;
}): Promise<OfferResponse> {
  const res = await fetch(`${API}/offers/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: params.lat,
      lon: params.lon,
      merchant_id: params.merchant_id,
      user_intent: params.user_intent || "browsing_general",
      user_id: params.user_id || "user_demo_001",
    }),
  });
  if (!res.ok) throw new Error("Failed to generate offer");
  return res.json();
}

export async function acceptOffer(offerId: string): Promise<OfferResponse> {
  const res = await fetch(`${API}/offers/${offerId}/accept`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to accept offer");
  return res.json();
}

export async function dismissOffer(offerId: string): Promise<void> {
  await fetch(`${API}/offers/${offerId}/dismiss`, { method: "POST" });
}

export async function getOffer(offerId: string): Promise<OfferResponse> {
  const res = await fetch(`${API}/offers/${offerId}`);
  if (!res.ok) throw new Error("Failed to fetch offer");
  return res.json();
}

export async function getWallet(userId = "user_demo_001") {
  const res = await fetch(`${API}/wallet/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

export interface ContextData {
  weather: {
    temp: number;
    feels_like: number;
    condition: string;
    description: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
  time: {
    datetime: string;
    date: string;
    time: string;
    day_of_week: string;
    is_weekend: boolean;
    is_holiday: boolean;
    holiday_name: string | null;
  };
  user_intent: { type: string; confidence: number };
  events: Array<{ name: string; category: string; start: string; venue_name: string }>;
  composite_trigger: string;
  trigger_score: number;
  ai_analysis: { should_trigger: boolean; reasoning: string; suggested_category: string; chosen_merchant: string };
  nearby_merchants?: Array<{ id: string; name: string; category: string; lat: number; lon: number; rating: number }>;
}

export async function fetchContext(params: {
  lat: number; lon: number;
  user_intent?: string;
  confidence?: number;
  zone?: string;
}): Promise<ContextData> {
  const res = await fetch(`${API}/context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: params.lat,
      lon: params.lon,
      user_intent: params.user_intent || "browsing_general",
      confidence: params.confidence || 0.5,
      zone: params.zone || "city_center",
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch context");
  return res.json();
}
