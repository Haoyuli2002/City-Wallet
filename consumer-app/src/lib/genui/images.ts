// Curated image bundle. PRD §11.2 forbids real-time image generation
// (copyright + reliability + brand). Each key resolves to a CSS-only hero
// (gradient + emoji glyph) so we ship zero binary assets and stay fast.
// Replace gradient/emoji with photographs in production — the contract
// (image_key string) stays stable.

export type ImageKey =
  | "warm-cup-rainy-window"
  | "iced-coffee-summer"
  | "fresh-bread-morning"
  | "ice-cream-sunset"
  | "lunch-menu-noon"
  | "cozy-pastry-rain";

export interface ImageRender {
  /** Two-stop gradient. Used as `linear-gradient(135deg, ...)`. */
  gradient: [string, string];
  /** Foreground glyph drawn over the gradient. */
  glyph: string;
  /** Short caption for a11y / fallback alt text. */
  alt_de: string;
}

export const IMAGES: Record<ImageKey, ImageRender> = {
  "warm-cup-rainy-window": {
    gradient: ["#3a2a1a", "#8b6f4a"],
    glyph: "☕",
    alt_de: "Warmer Cappuccino am Regenfenster",
  },
  "iced-coffee-summer": {
    gradient: ["#a3d8f4", "#5b9bd5"],
    glyph: "🧊",
    alt_de: "Eiskaffee im Sommer",
  },
  "fresh-bread-morning": {
    gradient: ["#f5d59a", "#c98b3d"],
    glyph: "🥐",
    alt_de: "Frisches Brot am Morgen",
  },
  "ice-cream-sunset": {
    gradient: ["#ffd1a4", "#ff8b94"],
    glyph: "🍦",
    alt_de: "Eis bei Sonnenuntergang",
  },
  "lunch-menu-noon": {
    gradient: ["#f4e1a4", "#c79e3a"],
    glyph: "🍽️",
    alt_de: "Mittagsmenü zur Mittagszeit",
  },
  "cozy-pastry-rain": {
    gradient: ["#8b6f4a", "#3a2a1a"],
    glyph: "🥨",
    alt_de: "Gebäck an einem regnerischen Nachmittag",
  },
};

export function gradientCss(key: ImageKey): string {
  const [a, b] = IMAGES[key].gradient;
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}
