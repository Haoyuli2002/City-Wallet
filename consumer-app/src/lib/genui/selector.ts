// The selector is the on-device SLM's interface to the renderer. It only
// emits letters (A/B/C/D...) for a few micro-multiple-choice tasks; the
// builder turns those letters into a fully-formed OfferProtocol. Keeping
// the surface this narrow lets us swap the implementation between mock
// (rules) and WebLLM (real Qwen2.5-0.5B) without touching renderers.

export type Choice = "A" | "B" | "C" | "D";

export type MotionKind = "stationary" | "browsing" | "commuting";
export type WeatherKind = "cold" | "hot" | "rainy" | "snowy" | "neutral";
export type TimeSlot = "early_morning" | "morning" | "lunch_break" | "afternoon" | "evening" | "late_night";
export type MerchantCategory = "cafe" | "bakery" | "ice_cream" | "restaurant" | "pharmacy" | "other";

export interface SelectorInput {
  weather: WeatherKind;
  temp_celsius: number;
  time_slot: TimeSlot;
  merchant_category: MerchantCategory;
  motion: MotionKind;
}

export interface SelectorOutput {
  /** A=warm-du, B=factual, C=urgent, D=playful */
  tone_choice: Choice;
  /** A..D map to a per-(weather × category) image set (see builder) */
  image_choice: Choice;
  /** A..D map to a per-context headline set (see builder) */
  headline_choice: Choice;
  /** Source label — useful for debugging in the right-hand context panel */
  source: "mock" | "webllm";
}

export interface Selector {
  select(input: SelectorInput): Promise<SelectorOutput>;
}

/**
 * Deterministic mock for M1 — also serves as the fallback when the on-device
 * model fails to load (PRD §11.2.5 fallback path 4). Encodes the same
 * heuristics we'd give the SLM as few-shot examples.
 */
export const mockSelector: Selector = {
  async select(ctx) {
    const tone_choice: Choice =
      ctx.motion === "commuting" ? "C" :
      ctx.weather === "cold" || ctx.weather === "rainy" ? "A" :
      ctx.weather === "hot" ? "D" :
      "B";

    const image_choice: Choice =
      ctx.weather === "cold" || ctx.weather === "rainy" ? "A" :
      ctx.weather === "hot" ? "B" :
      ctx.time_slot === "lunch_break" ? "C" :
      "D";

    const headline_choice: Choice =
      ctx.weather === "cold" ? "A" :
      ctx.weather === "rainy" ? "B" :
      ctx.weather === "hot" ? "C" :
      "D";

    return { tone_choice, image_choice, headline_choice, source: "mock" };
  },
};
