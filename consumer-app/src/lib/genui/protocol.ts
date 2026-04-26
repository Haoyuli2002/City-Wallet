// GenUI offer protocol — the contract between the on-device SLM and the
// renderer. The SLM never produces this directly; it only picks letters
// (A/B/C/...) for a few micro-multiple-choice tasks, and deterministic code
// assembles the protocol below. That way model hallucinations cannot leak
// into the UI: every text/image is a key into a curated bundle.

import type { HeadlineKey, SubheadlineKey, CTAKey } from "./copy";
import type { ImageKey } from "./images";

export type Layout = "warm-emotional" | "factual-compact" | "urgent" | "playful";
export type Tone = "warm-du" | "warm-sie" | "informational" | "urgent" | "playful" | "factual";
export type Urgency = "low" | "medium" | "high";
export type Language = "de" | "en";
export type Theme = "sparkassen-warm" | "sparkassen-cool" | "sparkassen-energetic";
export type WeatherTrigger = "cold" | "hot" | "rainy" | "snowy" | "neutral";

export type OfferComponent =
  | { type: "HeroImage"; image_key: ImageKey }
  | { type: "TriggerPill"; weather_trigger: WeatherTrigger; temp_celsius: number; label_key: HeadlineKey | "trigger_cold" | "trigger_rain" | "trigger_hot" }
  | { type: "Headline"; text_key: HeadlineKey }
  | { type: "Subheadline"; text_key: SubheadlineKey }
  | { type: "MerchantMeta"; merchant_name: string; distance_m: number; discount_percent: number }
  | { type: "Validity"; valid_minutes: number }
  | { type: "CashbackBadge"; amount_eur: number }
  | { type: "ActionButtons"; primary_cta_key: CTAKey; secondary_cta_key: CTAKey }
  | { type: "AIReasonBadge" };

export interface OfferProtocol {
  protocol_version: 1;
  language: Language;
  layout: Layout;
  tone: Tone;
  urgency: Urgency;
  theme: Theme;
  components: OfferComponent[];
  /** Offer ID this protocol renders — used by ActionButtons to wire accept/dismiss. */
  offer_id: string;
}

const COMPONENT_TYPES = new Set([
  "HeroImage",
  "TriggerPill",
  "Headline",
  "Subheadline",
  "MerchantMeta",
  "Validity",
  "CashbackBadge",
  "ActionButtons",
  "AIReasonBadge",
]);

/**
 * Lightweight runtime guard. We don't pull in zod for the hackathon — the
 * SLM never produces this object directly (deterministic code does), so the
 * only failure modes are dev-time typos or future schema drift.
 */
export function isValidProtocol(value: unknown): value is OfferProtocol {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (p.protocol_version !== 1) return false;
  if (typeof p.offer_id !== "string") return false;
  if (!Array.isArray(p.components)) return false;
  for (const c of p.components) {
    if (!c || typeof c !== "object") return false;
    const t = (c as { type?: unknown }).type;
    if (typeof t !== "string" || !COMPONENT_TYPES.has(t)) return false;
  }
  return true;
}
