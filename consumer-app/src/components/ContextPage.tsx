"use client";

import { useState, useEffect } from "react";
import TabBar from "@/components/TabBar";
import { fetchContext, generateOffer, acceptOffer, type ContextData, type OfferResponse } from "@/lib/api";
import OfferCard from "@/components/OfferCard";
import { getSavedCity } from "@/lib/store";

const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  munich:    { lat: 48.1371, lon: 11.5754 },
  stuttgart: { lat: 48.7758, lon:  9.1829 },
};

const INTENTS = [
  { id: "browsing_food",    label: "🍴 Browsing for Food",  desc: "Slow walk, meal time, looking for food" },
  { id: "browsing_general", label: "🚶 General Browsing",   desc: "Casual stroll, open to any offers" },
  { id: "commuting",        label: "🏃 Commuting",          desc: "Fast pace, going somewhere specific" },
  { id: "stationary",       label: "🧍 Stationary",         desc: "Standing still, possibly already inside" },
];

const WEATHER_BG: Record<string, string> = {
  Clear: "#fef9c3", Clouds: "#f0f4f8", Rain: "#e0f2fe",
  Drizzle: "#e0f2fe", Thunderstorm: "#f5f3ff", Snow: "#f0f9ff",
};

export default function ContextPage() {
  const [context, setContext] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState<string>("browsing_general");
  const [activeOffer, setActiveOffer] = useState<OfferResponse | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [city] = useState(getSavedCity());

  const loadContext = async (intent: string) => {
    setLoading(true);
    setError(null);
    const center = CITY_CENTERS[city] ?? CITY_CENTERS.munich;
    try {
      const data = await fetchContext({ lat: center.lat, lon: center.lon, user_intent: intent, confidence: 0.75 });
      setContext(data);
      // Auto-generate offer if AI recommends it
      if (data.ai_analysis?.should_trigger && data.nearby_merchants?.[0]) {
        setOfferLoading(true);
        try {
          const center = CITY_CENTERS[city] ?? CITY_CENTERS.munich;
          const offer = await generateOffer({
            lat: center.lat,
            lon: center.lon,
            merchant_id: data.nearby_merchants[0].id,
            user_intent: intent,
          });
          setActiveOffer(offer);
        } catch {
          // Silently fail — user can still explore manually
        } finally {
          setOfferLoading(false);
        }
      } else {
        setActiveOffer(null);
      }
    } catch {
      setError("Could not load context. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext(userIntent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const handleAccept = async () => {
    if (!activeOffer) return;
    try {
      const accepted = await acceptOffer(activeOffer.id);
      // Save to active offers
      if (typeof window !== "undefined") {
        const s = window.localStorage;
        if (s && typeof s.getItem === "function") {
          const existing = JSON.parse(s.getItem("cw_active_offers") || "[]");
          if (!existing.includes(accepted.id)) {
            s.setItem("cw_active_offers", JSON.stringify([accepted.id, ...existing]));
          }
        }
      }
      window.location.href = "/checkout";
    } catch (e) {
      console.error(e);
    }
  };

  const handleIntentChange = (intent: string) => {
    setUserIntent(intent);
    loadContext(intent);
  };

  const weatherBg = context ? (WEATHER_BG[context.weather.condition] ?? "#f4f4f5") : "#f4f4f5";

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-default)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>City Wallet</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
          My Context · {city.charAt(0).toUpperCase() + city.slice(1)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 12 }}>

        {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)", fontSize: 14 }}>Loading context…</div>}

        {error && <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        {context && !loading && (<>

          {/* Weather */}
          <div style={{ background: weatherBg, borderRadius: "var(--radius-lg)", padding: "18px 16px", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>
              🌤️ Weather
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>{context.weather.icon}</div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{context.weather.temp}°C</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{context.weather.condition} · {context.weather.description}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                  Feels {context.weather.feels_like}°C · Wind {context.weather.wind_speed}m/s · Humidity {context.weather.humidity}%
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>
              📅 Date & Time
            </div>

            {context.time.is_holiday && context.time.holiday_name && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1px solid #fbbf24", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Public Holiday</div>
                  <div style={{ fontSize: 12, color: "#78350f" }}>{context.time.holiday_name}</div>
                </div>
              </div>
            )}

            {context.time.is_weekend && !context.time.is_holiday && (
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 500 }}>Weekend</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 4 }}>Date</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{context.time.day_of_week}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{context.time.date}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 4 }}>Time</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{context.time.time}</div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          {context.ai_analysis.should_trigger && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#16a34a", marginBottom: 8 }}>
                🤖 AI Recommendation
              </div>
              <div style={{ fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>{context.ai_analysis.reasoning}</div>
              {context.ai_analysis.chosen_merchant && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#166534", fontFamily: "var(--font-mono)" }}>→ {context.ai_analysis.chosen_merchant}</div>
              )}
            </div>
          )}

          {/* Auto-generated Offer */}
          {offerLoading && (
            <div style={{ textAlign: "center", padding: "20px", background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>✨ Generating your personalised offer…</div>
            </div>
          )}

          {activeOffer && !offerLoading && (
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>
                ✨ Your AI Offer
              </div>
              <OfferCard
                offer={activeOffer}
                onAccept={handleAccept}
                onDismiss={() => {
                  setActiveOffer(null);
                  window.location.href = "/";
                }}
              />
              <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "var(--text-tertiary)" }}>
                Not interested? <a href="/" style={{ color: "var(--ink)", textDecoration: "underline" }}>Explore other merchants →</a>
              </div>
            </div>
          )}

          {/* User Intent */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>
              🧠 Your Intent
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
              AI infers this from your movement. Tap to override:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {INTENTS.map(intent => {
                const isActive = userIntent === intent.id;
                const isInferred = context.user_intent.type === intent.id;
                return (
                  <button key={intent.id} onClick={() => handleIntentChange(intent.id)} style={{
                    padding: "12px 14px", border: "1px solid",
                    borderColor: isActive ? "var(--ink)" : "var(--border-default)",
                    background: isActive ? "var(--ink)" : "var(--surface)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    borderRadius: "var(--radius-md)", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{intent.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{intent.desc}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      {isActive && <span style={{ fontSize: 12 }}>✓</span>}
                      {isInferred && !isActive && (
                        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4 }}>
                          AI inferred
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontStyle: "italic" }}>
              Your selection affects which offers AI generates for you.
            </div>
          </div>

          {/* Nearby Events */}
          {context.events && context.events.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>
                🎭 Nearby Events
              </div>
              {context.events.slice(0, 5).map((ev, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🪄</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      {ev.venue_name} · {ev.start ? new Date(ev.start).toLocaleTimeString("en-DE", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh */}
          <button onClick={() => loadContext(userIntent)} style={{ padding: "12px", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", fontSize: 13, color: "var(--text-tertiary)", cursor: "pointer" }}>
            🔄 Refresh Context
          </button>

        </>)}
      </div>
      <TabBar />
    </div>
  );
}
