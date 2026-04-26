"use client";

import { useEffect, useState } from "react";
import type { OfferResponse } from "@/lib/api";

interface Props {
  offer: OfferResponse;
  onAccept: () => void;
  onDismiss: () => void;
}

function useCountdown(expiresAt: string) {
  const getRemaining = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };
  const [seconds, setSeconds] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setSeconds(getRemaining()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { seconds, label: `${mm}:${ss}` };
}

export default function OfferCard({ offer, onAccept, onDismiss }: Props) {
  const { content, merchant, expires_at } = offer;
  const { seconds, label: timeLabel } = useCountdown(expires_at);
  const isUrgent = seconds < 120;

  // Use AI-decided colors
  const bg    = content.color_background || "#FFF8DC";
  const primary = content.color_primary  || "#8B4513";
  const accent  = content.color_accent   || "#D2691E";

  // Determine text color based on background brightness
  const isLightBg = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
    return (r*299 + g*587 + b*114) / 1000 > 128;
  };
  const textOnPrimary = isLightBg(primary) ? "#000" : "#fff";

  return (
    <div style={{
      background: bg,
      borderRadius: "var(--radius-xl)",
      padding: "20px 18px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      border: `1px solid ${accent}40`,
      maxWidth: 406,
      margin: "0 auto",
    }}>
      {/* Icon */}
      <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>
        {content.icon}
      </div>

      {/* Headline — AI generated */}
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: primary, marginBottom: 6, lineHeight: 1.2 }}>
        {content.headline}
      </div>

      {/* Subtext — AI generated */}
      <div style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 14 }}>
        {content.subtext}
      </div>

      {/* Merchant info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "10px 12px", background: "rgba(0,0,0,0.06)", borderRadius: "var(--radius-md)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{merchant.name}</div>
          <div style={{ fontSize: 11, color: "#777", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ★{merchant.rating} · {merchant.category}
          </div>
        </div>
        {/* Discount badge */}
        <div style={{
          background: accent, color: textOnPrimary === "#fff" ? "#fff" : "#fff",
          fontSize: 16, fontWeight: 800,
          padding: "6px 12px", borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-mono)",
        }}>
          -{content.discount_percent}%
        </div>
      </div>

      {/* Countdown */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 14, fontSize: 12,
        color: isUrgent ? "#e63946" : "#777",
        fontFamily: "var(--font-mono)",
        fontWeight: isUrgent ? 700 : 400,
      }}>
        <span>⏱</span>
        <span>{seconds === 0 ? "Expired" : `${timeLabel} remaining`}</span>
      </div>

      {/* Actions */}
      {seconds > 0 ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onAccept}
            style={{
              flex: 1, padding: "14px",
              background: primary, color: textOnPrimary,
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            {content.icon} {content.cta_text}
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: "14px 16px",
              background: "rgba(0,0,0,0.08)", color: "#555",
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: 13, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "12px", background: "rgba(0,0,0,0.06)", borderRadius: "var(--radius-md)", fontSize: 13, color: "#888" }}>
          This offer has expired
        </div>
      )}

      {/* AI reasoning (subtle) */}
      {content.reasoning && (
        <div style={{ marginTop: 10, fontSize: 10, color: "#aaa", fontStyle: "italic", textAlign: "center", lineHeight: 1.4 }}>
          AI: {content.reasoning}
        </div>
      )}
    </div>
  );
}
