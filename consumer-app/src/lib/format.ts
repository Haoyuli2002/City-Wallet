// Locale formatters — German first, mirrors the prototype copy rules:
//   - Distance under 1 km in meters ("80 m"); 1.2 km uses comma.
//   - Currency: "4,90 €" with comma decimal separator and trailing €.
//   - Time: 24-hour clock.

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatEuro(value: number, opts: { sign?: boolean } = {}): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  const prefix = opts.sign ? (value >= 0 ? "+ " : "− ") : "";
  return `${prefix}${formatted} €`;
}

export function formatPercent(percent: number): string {
  return `−${Math.round(percent)} %`;
}

export function formatClock(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatHistoryDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} · ${formatClock(d)}`;
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600).toString().padStart(2, "0");
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatMinutesShort(seconds: number): string {
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `noch ${minutes} Min.`;
}

export function weightLabel(weight: 1 | 2 | 3): string {
  return "+".repeat(weight);
}
