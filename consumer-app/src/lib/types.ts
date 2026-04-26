// Wire types — mirror backend/API_DOCS.md so the mock layer can later be
// swapped for real fetch calls without touching components.

export type WeatherTrigger = "cold" | "hot" | "rainy" | "snowy" | "neutral";
export type UserIntent = "browsing_food" | "browsing_general" | "commuting" | "stationary";
export type TimeSlot =
  | "early_morning"
  | "morning"
  | "lunch_break"
  | "afternoon"
  | "evening"
  | "late_night";
export type DayType = "weekday" | "weekend";
export type TxStatus = "very_low" | "low" | "normal" | "high";
export type Mood = "cozy" | "energetic" | "fresh" | "warm" | "professional";

export interface Weather {
  temp: number;
  feels_like: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
  trigger: WeatherTrigger;
}

export interface TimeBlock {
  current: string;
  slot: TimeSlot;
  day_type: DayType;
  label: string;
}

export interface NearbyMerchant {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  rating: number;
  photo_url?: string;
  distance_m: number;
  tx_density: {
    current_hour: number;
    avg_hour: number;
    status: TxStatus;
    demand_gap: number;
  };
}

export interface ContextResponse {
  weather: Weather;
  time: TimeBlock;
  user_intent: { type: UserIntent; confidence: number };
  nearby_merchants: NearbyMerchant[];
  composite_trigger: string;
  trigger_score: number;
}

export interface OfferContent {
  headline: string;
  subtext: string;
  discount_percent: number;
  original_item: string;
  cta_text: string;
  mood: Mood;
  color_primary: string;
  color_background: string;
  color_accent: string;
  icon: string;
  valid_minutes: number;
  reasoning: string;
}

export type OfferStatus = "generated" | "accepted" | "redeemed" | "dismissed" | "expired";

export interface Offer {
  id: string;
  merchant: Pick<NearbyMerchant, "id" | "name" | "category" | "rating" | "photo_url" | "distance_m">;
  content: OfferContent;
  status: OfferStatus;
  created_at: string;
  expires_at: string;
  /** Trigger label rendered as the U-4 pill, e.g. "Draußen kalt · 8 °C". */
  trigger_label: string;
  /** Cashback to be credited on redemption (EUR). */
  cashback_eur: number;
  /** Per-signal weights backing the KI-Erklärung sheet. */
  reasons: OfferReason[];
}

export interface OfferReason {
  kind: "weather" | "time" | "merchant" | "preference";
  label: string;
  value: string;
  /** Visual weight, rendered as "+", "++" or "+++". */
  weight: 1 | 2 | 3;
}

export interface AcceptedOffer extends Offer {
  status: "accepted" | "redeemed";
  qr_code: string;
  token: string;
}

export interface WalletTransaction {
  id: number;
  type: "cashback";
  amount: number;
  description: string;
  created_at: string;
  /** German-formatted display label, used by U-5 history rows. */
  merchant_name: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  month_label: string;
  transactions: WalletTransaction[];
}
