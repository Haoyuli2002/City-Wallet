// Mock API. Mirrors the consumer endpoints in API_DOCS.md so swapping to a
// real fetch later is a one-file change. Persists offer state in a simple
// in-memory store so accept → redeem → wallet flows are coherent within a
// session.
//
// Set NEXT_PUBLIC_API_BASE to point at the real backend when ready; for now
// every function returns deterministic German-language demo data.

import type {
  AcceptedOffer,
  ContextResponse,
  Offer,
  OfferReason,
  Wallet,
  WalletTransaction,
} from "./types";
import { formatHistoryDate } from "./format";

const STORE_KEY = "__cityWalletStore";

interface Store {
  offers: Record<string, Offer | AcceptedOffer>;
  wallet: Wallet;
}

function getStore(): Store {
  const g = globalThis as unknown as { [STORE_KEY]?: Store };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      offers: { [seedOffer.id]: seedOffer },
      wallet: seedWallet(),
    };
  }
  return g[STORE_KEY]!;
}

const baseTime = new Date();
baseTime.setHours(14, 30, 0, 0);

const cafeMueller = {
  id: "m_cafemueller",
  name: "Café Müller",
  category: "cafe",
  rating: 4.6,
  distance_m: 80,
};

const seedReasons: OfferReason[] = [
  { kind: "weather", label: "Wetter", value: "Stuttgart · 8 °C, leichter Regen", weight: 3 },
  { kind: "time", label: "Tageszeit", value: "Mittagspause · 14:30 Uhr", weight: 2 },
  { kind: "merchant", label: "Händlersignal", value: "Café Müller · momentan ruhig", weight: 2 },
  { kind: "preference", label: "Deine Vorlieben", value: "Kaffee · 7× in 4 Wochen eingelöst", weight: 1 },
];

const seedOffer: Offer = {
  id: "offer_cappuccino_lunch",
  merchant: cafeMueller,
  content: {
    headline: "Draußen kalt?",
    subtext: "Dein Cappuccino wartet schon.",
    discount_percent: 20,
    original_item: "Cappuccino",
    cta_text: "Einlösen",
    mood: "cozy",
    color_primary: "#FF0000",
    color_background: "#FFFFFF",
    color_accent: "#C8102E",
    icon: "coffee",
    valid_minutes: 15,
    reasoning: "Kaltes Wetter + Mittagspause + ruhiges Café → warmes Getränk",
  },
  status: "generated",
  created_at: baseTime.toISOString(),
  expires_at: new Date(baseTime.getTime() + 15 * 60_000).toISOString(),
  trigger_label: "Draußen kalt · 8 °C",
  cashback_eur: 0.8,
  reasons: seedReasons,
};

function seedWallet(): Wallet {
  const tx = (id: number, days: number, hour: number, minute: number, name: string, amount: number): WalletTransaction => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return {
      id,
      type: "cashback",
      amount,
      description: `Cashback bei ${name}`,
      created_at: d.toISOString(),
      merchant_name: name,
    };
  };
  return {
    user_id: "user_demo_001",
    balance: 12.4,
    month_label: "Oktober",
    transactions: [
      tx(1, 2, 9, 14, "Apotheke am Markt", 0.5),
      tx(2, 4, 14, 42, "Café Müller", 0.8),
      tx(3, 7, 8, 3, "Bäckerei Klein", 0.6),
      tx(4, 10, 18, 12, "EDEKA Eppendorf", 5.0),
      tx(5, 12, 10, 4, "Balzac Coffee", 2.4),
    ],
  };
}

// ─── Mocked endpoints ─────────────────────────────────────────────────────

function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getContext(): Promise<ContextResponse> {
  return delay({
    weather: {
      temp: 8,
      feels_like: 6,
      condition: "Rain",
      description: "leichter Schauer",
      humidity: 78,
      wind_speed: 3.2,
      icon: "rain",
      trigger: "cold",
    },
    time: {
      current: baseTime.toISOString(),
      slot: "lunch_break",
      day_type: "weekday",
      label: "Dienstagmittag",
    },
    user_intent: { type: "browsing_food", confidence: 0.85 },
    nearby_merchants: [
      {
        ...cafeMueller,
        lat: 48.7758,
        lon: 9.1829,
        photo_url: undefined,
        tx_density: { current_hour: 3, avg_hour: 12, status: "very_low", demand_gap: 0.75 },
      },
    ],
    composite_trigger: "warm_drink_opportunity",
    trigger_score: 0.92,
  });
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  return delay(getStore().offers[id]);
}

export async function listLiveOffers(): Promise<Offer[]> {
  return delay(Object.values(getStore().offers).filter((o) => o.status === "generated" || o.status === "accepted"));
}

export async function acceptOffer(id: string): Promise<AcceptedOffer | undefined> {
  const store = getStore();
  const offer = store.offers[id];
  if (!offer) return undefined;
  const accepted: AcceptedOffer = {
    ...offer,
    status: "accepted",
    token: `CW-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    qr_code: "",
  };
  store.offers[id] = accepted;
  return delay(accepted);
}

export async function dismissOffer(id: string): Promise<{ status: "dismissed" }> {
  const store = getStore();
  if (store.offers[id]) {
    store.offers[id] = { ...store.offers[id], status: "dismissed" };
  }
  return delay({ status: "dismissed" });
}

export async function markRedeemed(id: string): Promise<Offer | undefined> {
  const store = getStore();
  const offer = store.offers[id];
  if (!offer) return undefined;
  const redeemed: Offer = { ...offer, status: "redeemed" };
  store.offers[id] = redeemed;
  store.wallet.balance += offer.cashback_eur;
  store.wallet.transactions.unshift({
    id: store.wallet.transactions.length + 1,
    type: "cashback",
    amount: offer.cashback_eur,
    description: `Cashback bei ${offer.merchant.name}`,
    created_at: new Date().toISOString(),
    merchant_name: offer.merchant.name,
  });
  return delay(redeemed);
}

export async function getWallet(): Promise<Wallet> {
  return delay(getStore().wallet);
}

export { formatHistoryDate };
