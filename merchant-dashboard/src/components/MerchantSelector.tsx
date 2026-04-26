"use client";

import { useState, useEffect } from "react";
import { getMerchants, type Merchant } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  bakery: "🥖",
  bar: "🍺",
  book_store: "📚",
};

const CITIES = [
  { id: "munich",    label: "Munich",    flag: "🏙️" },
  { id: "stuttgart", label: "Stuttgart", flag: "🏛️" },
];

interface Props {
  onSelect: (id: string, name: string) => void;
}

export default function MerchantSelector({ onSelect }: Props) {
  const [selectedCity, setSelectedCity] = useState("munich");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMerchants(selectedCity)
      .then(setMerchants)
      .catch(() => setError("Could not connect to backend. Make sure the server is running on localhost:8000"))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--surface-muted)",
      display: "flex",
      flexDirection: "column",
      maxWidth: 430,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        background: "var(--ink)",
        color: "#fff",
        padding: "48px 24px 28px",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: 8,
        }}>
          City Wallet · Merchant
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Select your store
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
          Choose city and store to manage
        </div>
      </div>

      {/* City selector */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "12px 16px",
        display: "flex",
        gap: 8,
      }}>
        {CITIES.map(city => (
          <button
            key={city.id}
            onClick={() => setSelectedCity(city.id)}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid",
              borderColor: selectedCity === city.id ? "var(--ink)" : "var(--border-default)",
              background: selectedCity === city.id ? "var(--ink)" : "var(--surface)",
              color: selectedCity === city.id ? "#fff" : "var(--text-secondary)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: selectedCity === city.id ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            <span>{city.flag}</span>
            <span>{city.label}</span>
          </button>
        ))}
      </div>

      {/* Merchant list */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            Loading {selectedCity === "munich" ? "Munich" : "Stuttgart"} stores...
          </div>
        )}
        {error && (
          <div style={{
            padding: 16,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            color: "#dc2626",
          }}>
            {error}
          </div>
        )}
        {!loading && !error && merchants.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            No stores found in {selectedCity === "munich" ? "Munich" : "Stuttgart"}.
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Run <code style={{ background: "#f4f4f5", padding: "2px 6px", borderRadius: 4 }}>python models/seed.py</code> to seed data.
            </div>
          </div>
        )}
        {merchants.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id, m.name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{
              width: 44, height: 44,
              borderRadius: 10,
              background: "var(--surface-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              {CATEGORY_ICONS[m.category] || "🏪"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                {m.name}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-tertiary)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginTop: 2,
              }}>
                {m.category} · ★{m.rating}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
