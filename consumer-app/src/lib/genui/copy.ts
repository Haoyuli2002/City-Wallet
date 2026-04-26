// Curated text bundle. The on-device SLM (Qwen2.5-0.5B) is too small to
// write reliable German on its own, so it only picks a key from this map.
// Every phrase here was authored by a human — the model just chooses which
// one fits the context.

import type { Language } from "./protocol";

export type HeadlineKey =
  | "cold_outside_q"
  | "rainy_break_q"
  | "hot_outside_q"
  | "lunch_pause_q"
  | "trigger_cold"
  | "trigger_rain"
  | "trigger_hot";

export type SubheadlineKey =
  | "cappuccino_waiting"
  | "warm_drink_nearby"
  | "ice_cream_now"
  | "fresh_bakery_now"
  | "lunch_menu_now";

export type CTAKey =
  | "redeem"
  | "redeem_now"
  | "not_now"
  | "save_to_wallet";

type Entry = Record<Language, string>;

export const HEADLINES: Record<HeadlineKey, Entry> = {
  cold_outside_q:   { de: "Draußen kalt?",        en: "Cold outside?" },
  rainy_break_q:    { de: "Pause vom Regen?",     en: "Break from the rain?" },
  hot_outside_q:    { de: "Draußen heiß?",        en: "Hot outside?" },
  lunch_pause_q:    { de: "Mittagspause?",        en: "Lunch break?" },
  trigger_cold:     { de: "Draußen kalt",         en: "Cold outside" },
  trigger_rain:     { de: "Es regnet",            en: "It's raining" },
  trigger_hot:      { de: "Draußen heiß",         en: "Hot outside" },
};

export const SUBHEADLINES: Record<SubheadlineKey, Entry> = {
  cappuccino_waiting: { de: "Dein Cappuccino wartet schon.", en: "Your cappuccino is waiting." },
  warm_drink_nearby:  { de: "Etwas Warmes ist 80 m entfernt.", en: "Something warm is 80 m away." },
  ice_cream_now:      { de: "Eis um die Ecke — heute besonders günstig.", en: "Ice cream around the corner — extra cheap today." },
  fresh_bakery_now:   { de: "Frisch aus dem Ofen, gleich um die Ecke.", en: "Fresh from the oven, just around the corner." },
  lunch_menu_now:     { de: "Mittagsmenü wartet — −20% bis 14:30.",     en: "Lunch menu waiting — −20% until 14:30." },
};

export const CTAS: Record<CTAKey, Entry> = {
  redeem:         { de: "Einlösen",              en: "Redeem" },
  redeem_now:     { de: "Jetzt einlösen",        en: "Redeem now" },
  not_now:        { de: "Nicht jetzt",           en: "Not now" },
  save_to_wallet: { de: "In Wallet speichern",   en: "Save to wallet" },
};

export function t<K extends string>(map: Record<K, Entry>, key: K, lang: Language): string {
  return map[key]?.[lang] ?? map[key]?.de ?? key;
}
