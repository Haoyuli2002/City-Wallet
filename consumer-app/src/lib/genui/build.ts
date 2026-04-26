// Turn (offer + context + SLM choices) into a fully-formed OfferProtocol.
// All UI strings/images come from curated bundles — the SLM never produces
// free German text or invented image URLs. If the SLM picks an out-of-range
// letter, we fall back to choice "A" silently.

import type {
  Layout, Tone, Urgency, Theme,
  OfferProtocol, OfferComponent, Language, WeatherTrigger,
} from "./protocol";
import type {
  Choice, SelectorInput, SelectorOutput, MerchantCategory, WeatherKind,
} from "./selector";
import type { HeadlineKey, SubheadlineKey, CTAKey } from "./copy";
import type { ImageKey } from "./images";

// ─── Candidate sets ───────────────────────────────────────────────────────
// Each tuple is [A, B, C, D]. The SLM's job is just to pick an index.

const TONE_OPTIONS: [Tone, Tone, Tone, Tone] = ["warm-du", "factual", "urgent", "playful"];

const HEADLINE_OPTIONS_BY_WEATHER: Record<WeatherKind, [HeadlineKey, HeadlineKey, HeadlineKey, HeadlineKey]> = {
  cold:    ["cold_outside_q",  "rainy_break_q",  "lunch_pause_q",  "cold_outside_q"],
  rainy:   ["rainy_break_q",   "cold_outside_q", "lunch_pause_q",  "rainy_break_q"],
  hot:     ["hot_outside_q",   "lunch_pause_q",  "hot_outside_q",  "lunch_pause_q"],
  snowy:   ["cold_outside_q",  "rainy_break_q",  "lunch_pause_q",  "cold_outside_q"],
  neutral: ["lunch_pause_q",   "lunch_pause_q",  "lunch_pause_q",  "lunch_pause_q"],
};

const SUBHEAD_BY_CATEGORY: Record<MerchantCategory, SubheadlineKey> = {
  cafe:       "cappuccino_waiting",
  bakery:     "fresh_bakery_now",
  ice_cream:  "ice_cream_now",
  restaurant: "lunch_menu_now",
  pharmacy:   "warm_drink_nearby",
  other:      "warm_drink_nearby",
};

const IMAGE_OPTIONS_BY_WEATHER: Record<WeatherKind, [ImageKey, ImageKey, ImageKey, ImageKey]> = {
  cold:    ["warm-cup-rainy-window", "cozy-pastry-rain",   "lunch-menu-noon",    "fresh-bread-morning"],
  rainy:   ["warm-cup-rainy-window", "cozy-pastry-rain",   "lunch-menu-noon",    "fresh-bread-morning"],
  hot:     ["iced-coffee-summer",    "ice-cream-sunset",   "lunch-menu-noon",    "fresh-bread-morning"],
  snowy:   ["warm-cup-rainy-window", "cozy-pastry-rain",   "lunch-menu-noon",    "fresh-bread-morning"],
  neutral: ["lunch-menu-noon",       "fresh-bread-morning","warm-cup-rainy-window","ice-cream-sunset"],
};

// ─── Tone → presentation tokens ───────────────────────────────────────────

const LAYOUT_BY_TONE: Record<Tone, Layout> = {
  "warm-du":      "warm-emotional",
  "warm-sie":     "warm-emotional",
  "factual":      "factual-compact",
  "informational":"factual-compact",
  "urgent":       "urgent",
  "playful":      "playful",
};

const THEME_BY_TONE: Record<Tone, Theme> = {
  "warm-du":      "sparkassen-warm",
  "warm-sie":     "sparkassen-warm",
  "factual":      "sparkassen-cool",
  "informational":"sparkassen-cool",
  "urgent":       "sparkassen-energetic",
  "playful":      "sparkassen-energetic",
};

const URGENCY_BY_TONE: Record<Tone, Urgency> = {
  "warm-du":       "low",
  "warm-sie":      "low",
  "factual":       "medium",
  "informational": "medium",
  "urgent":        "high",
  "playful":       "low",
};

const PRIMARY_CTA_BY_URGENCY: Record<Urgency, CTAKey> = {
  low:    "redeem",
  medium: "redeem",
  high:   "redeem_now",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function indexOfChoice(c: Choice): 0 | 1 | 2 | 3 {
  switch (c) { case "A": return 0; case "B": return 1; case "C": return 2; case "D": return 3; }
}

function pick<T>(opts: readonly [T, T, T, T], c: Choice, fallback: T = opts[0]): T {
  const i = indexOfChoice(c);
  return opts[i] ?? fallback;
}

function weatherTriggerFromKind(w: WeatherKind): WeatherTrigger {
  return w;
}

function triggerLabelKey(w: WeatherKind): "trigger_cold" | "trigger_rain" | "trigger_hot" {
  if (w === "cold" || w === "snowy") return "trigger_cold";
  if (w === "rainy") return "trigger_rain";
  return "trigger_hot";
}

// ─── Build ────────────────────────────────────────────────────────────────

export interface BuildArgs {
  offer_id: string;
  merchant: { name: string; category: MerchantCategory; distance_m: number };
  context: SelectorInput;
  choices: SelectorOutput;
  discount_percent: number;
  valid_minutes: number;
  cashback_eur: number;
  language?: Language;
}

export function buildProtocol(args: BuildArgs): OfferProtocol {
  const language: Language = args.language ?? "de";
  const tone = pick(TONE_OPTIONS, args.choices.tone_choice);
  const layout = LAYOUT_BY_TONE[tone];
  const theme = THEME_BY_TONE[tone];
  const urgency = URGENCY_BY_TONE[tone];

  const image_key = pick(IMAGE_OPTIONS_BY_WEATHER[args.context.weather], args.choices.image_choice);
  const headline_key = pick(HEADLINE_OPTIONS_BY_WEATHER[args.context.weather], args.choices.headline_choice);
  const subhead_key = SUBHEAD_BY_CATEGORY[args.merchant.category];

  const components: OfferComponent[] = [
    { type: "HeroImage", image_key },
    {
      type: "TriggerPill",
      weather_trigger: weatherTriggerFromKind(args.context.weather),
      temp_celsius: args.context.temp_celsius,
      label_key: triggerLabelKey(args.context.weather),
    },
    { type: "Headline", text_key: headline_key },
    { type: "Subheadline", text_key: subhead_key },
    {
      type: "MerchantMeta",
      merchant_name: args.merchant.name,
      distance_m: args.merchant.distance_m,
      discount_percent: args.discount_percent,
    },
    { type: "Validity", valid_minutes: args.valid_minutes },
    { type: "CashbackBadge", amount_eur: args.cashback_eur },
    {
      type: "ActionButtons",
      primary_cta_key: PRIMARY_CTA_BY_URGENCY[urgency],
      secondary_cta_key: "not_now",
    },
    { type: "AIReasonBadge" },
  ];

  return {
    protocol_version: 1,
    language,
    layout,
    tone,
    urgency,
    theme,
    components,
    offer_id: args.offer_id,
  };
}
