// Micro-multiple-choice prompts for the on-device SLM (PRD §11.2.3).
// Each prompt asks the model to emit ONE letter A-D after a few-shot block.
// No free German generation, no JSON construction — the model's job is to
// pick an index, full stop. The builder maps that index to a curated bundle
// (see ./build.ts).

import type { SelectorInput } from "./selector";

function ctxLine(input: SelectorInput): string {
  const w = ({
    cold: "kalt",
    hot: "heiß",
    rainy: "regnerisch",
    snowy: "Schnee",
    neutral: "neutral",
  } as const)[input.weather];
  const motion = ({
    stationary: "stehend",
    browsing: "schlendert langsam",
    commuting: "in Eile, schneller Schritt",
  } as const)[input.motion];
  const cat = ({
    cafe: "Café (Heißgetränke)",
    bakery: "Bäckerei",
    ice_cream: "Eisdiele",
    restaurant: "Restaurant (Mittagsmenü)",
    pharmacy: "Apotheke",
    other: "Geschäft",
  } as const)[input.merchant_category];
  const slot = ({
    early_morning: "frühmorgens",
    morning: "Vormittag",
    lunch_break: "Mittagspause",
    afternoon: "Nachmittag",
    evening: "Abend",
    late_night: "spät abends",
  } as const)[input.time_slot];
  return `Wetter: ${w}, ${Math.round(input.temp_celsius)}°C · Zeit: ${slot} · Nutzer: ${motion} · Händler: ${cat}`;
}

export function tonePrompt(input: SelectorInput): string {
  return `Du bist ein Empfehlungsassistent. Wähle den passenden Tonfall.

Optionen:
A) warm-du   (warm, persönlich, "du")
B) factual   (sachlich, kurz)
C) urgent    (zeitlich knapp)
D) playful   (verspielt, locker)

Beispiel 1: Wetter: kalt, 8°C · Mittagspause · schlendert langsam · Café → A
Beispiel 2: Wetter: heiß, 28°C · Nachmittag · schlendert · Eisdiele → D
Beispiel 3: Wetter: neutral, 20°C · in Eile · Bäckerei → C
Beispiel 4: Wetter: neutral, 18°C · Vormittag · stehend · Apotheke → B

Jetzt:
${ctxLine(input)} →

Antwort (nur ein Buchstabe A, B, C oder D):`;
}

export function imagePrompt(input: SelectorInput): string {
  // Image candidate sets are weather-keyed in build.ts. The model picks an
  // index — it doesn't need to know the actual image_keys.
  return `Wähle das passende Bildmotiv für die Aktion.

Optionen (in dieser Reihenfolge):
A) erste Wahl (Standard für dieses Wetter)
B) Alternative (gleiche Stimmung)
C) zeitbezogen (passt zur Tageszeit)
D) händlerbezogen (passt zur Branche)

Beispiel 1: Wetter: kalt · Café · Mittagspause → A
Beispiel 2: Wetter: heiß · Eisdiele · Nachmittag → A
Beispiel 3: Wetter: neutral · Mittagspause · Restaurant → C
Beispiel 4: Wetter: neutral · Vormittag · Bäckerei → D

Jetzt:
${ctxLine(input)} →

Antwort (nur ein Buchstabe A, B, C oder D):`;
}

export function headlinePrompt(input: SelectorInput): string {
  return `Wähle die passende Schlagzeile.

Optionen (in dieser Reihenfolge, abhängig vom Wetter):
A) erste Wahl (am meisten passend)
B) Alternative
C) zeitbezogen ("Mittagspause?")
D) gleich wie A

Beispiel 1: Wetter: kalt, 8°C → A
Beispiel 2: Wetter: regnerisch, 12°C → A
Beispiel 3: Wetter: heiß, 28°C → A
Beispiel 4: Wetter: neutral, 19°C · Mittagspause → C

Jetzt:
${ctxLine(input)} →

Antwort (nur ein Buchstabe A, B, C oder D):`;
}
