"use client";

import { useEffect, useMemo, useState } from "react";
import { DynamicCard } from "./DynamicCard";
import { mockSelector } from "@/lib/genui/selector";
import type { SelectorInput, SelectorOutput, MerchantCategory, WeatherKind } from "@/lib/genui/selector";
import { buildProtocol } from "@/lib/genui/build";
import type { OfferProtocol } from "@/lib/genui/protocol";
import type { Offer, ContextResponse } from "@/lib/types";
import { isWebGpuAvailable, makeWebLLMSelector } from "@/lib/genui/webllm-selector";

interface OfferRendererProps {
  offer: Offer;
  context: ContextResponse;
}

/**
 * Bridges server-fetched offer/context into the client-side GenUI selector.
 * Renders twice in the worst case: first with the mock selector (instant)
 * so the card is never blank, then again once Qwen2.5-0.5B finishes loading
 * and re-picks. The user sees the source chip flip from "⚙ mock" → "🧠 on-device".
 */
export function OfferRenderer({ offer, context }: OfferRendererProps) {
  const input = useMemo(() => toSelectorInput(offer, context), [offer, context]);

  const initialChoices: SelectorOutput = { tone_choice: "A", image_choice: "A", headline_choice: "A", source: "mock" };
  const [protocol, setProtocol] = useState<OfferProtocol>(() => buildFromChoices(offer, input, initialChoices));
  const [source, setSource] = useState<string>("mock");
  const [loadProgress, setLoadProgress] = useState<{ pct: number; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Pass 1: mock — synchronous-feeling, never leaves the user staring at nothing.
    mockSelector.select(input).then((choices) => {
      if (cancelled) return;
      setProtocol(buildFromChoices(offer, input, choices));
      setSource("mock");
    });

    // Pass 2: WebLLM — only attempted if WebGPU is available.
    const gpuOk = isWebGpuAvailable();
    console.log("[GenUI] WebGPU available:", gpuOk);
    if (!gpuOk) return;

    const webllm = makeWebLLMSelector({
      onProgress: (pct, text) => {
        if (cancelled) return;
        setLoadProgress({ pct, text });
      },
    });
    console.log("[GenUI] WebLLM selector kicked off");
    webllm.select(input).then((choices) => {
      if (cancelled) return;
      console.log("[GenUI] WebLLM returned:", choices);
      setLoadProgress(null);
      // If WebLLM returned the mock fallback (because the engine actually
      // failed mid-flight), don't overwrite — the mock pass already set state.
      if (choices.source === "webllm") {
        setProtocol(buildFromChoices(offer, input, choices));
        setSource("webllm");
      }
    }).catch((e) => {
      console.error("[GenUI] WebLLM selector threw:", e);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  const sourceLabel = loadProgress
    ? `🧠 lädt ${Math.round(loadProgress.pct * 100)}%`
    : source;

  return <DynamicCard protocol={protocol} reasons={offer.reasons} selectorSource={sourceLabel} />;
}

function buildFromChoices(offer: Offer, input: SelectorInput, choices: SelectorOutput): OfferProtocol {
  return buildProtocol({
    offer_id: offer.id,
    merchant: {
      name: offer.merchant.name,
      category: normalizeCategory(offer.merchant.category),
      distance_m: offer.merchant.distance_m,
    },
    context: input,
    choices,
    discount_percent: offer.content.discount_percent,
    valid_minutes: offer.content.valid_minutes,
    cashback_eur: offer.cashback_eur,
    language: "de",
  });
}

function toSelectorInput(offer: Offer, ctx: ContextResponse): SelectorInput {
  return {
    weather: normalizeWeather(ctx.weather.trigger),
    temp_celsius: ctx.weather.temp,
    time_slot: ctx.time.slot,
    merchant_category: normalizeCategory(offer.merchant.category),
    motion: ctx.user_intent.type === "commuting" ? "commuting" : ctx.user_intent.type === "stationary" ? "stationary" : "browsing",
  };
}

function normalizeCategory(c: string): MerchantCategory {
  const k = c.toLowerCase();
  if (k.includes("cafe") || k.includes("café")) return "cafe";
  if (k.includes("bakery") || k.includes("bäcker")) return "bakery";
  if (k.includes("ice") || k.includes("eis")) return "ice_cream";
  if (k.includes("restaurant") || k.includes("imbiss")) return "restaurant";
  if (k.includes("apoth") || k.includes("pharmacy")) return "pharmacy";
  return "other";
}

function normalizeWeather(t: string): WeatherKind {
  if (t === "cold" || t === "hot" || t === "rainy" || t === "snowy" || t === "neutral") return t;
  return "neutral";
}
