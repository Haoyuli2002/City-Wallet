"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateOffer, acceptOffer, dismissOffer, type OfferResponse } from "@/lib/api";
import { addActiveOffer } from "@/lib/store";

export default function NotificationBanner() {
  const router = useRouter();
  const [offer, setOffer] = useState<OfferResponse | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem("cw_notif_dismissed")) return;

    const timer = setTimeout(async () => {
      try {
        const o = await generateOffer({
          lat: 48.1371,
          lon: 11.5754,
          merchant_id: "",
          user_intent: "browsing_food",
          user_id: "user_demo_001",
        });
        if (o && o.id) {
          setOffer(o);
          setVisible(true);
        }
      } catch {
        // silently fail
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed || !offer) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const accepted = await acceptOffer(offer.id);
      if (accepted?.token) {
        addActiveOffer(offer.id);
      }
      setVisible(false);
      router.push("/checkout");
    } catch {
      setVisible(false);
    }
  };

  const handleDismiss = async () => {
    try { await dismissOffer(offer.id); } catch {}
    setDismissed(true);
    setVisible(false);
    if (typeof window !== "undefined") sessionStorage.setItem("cw_notif_dismissed", "1");
  };

  const { content, merchant } = offer;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        animation: "slideDown 0.4s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          padding: "0 12px",
          paddingTop: 8,
        }}
      >
        <div
          style={{
            background: content.color_background || "#fff",
            border: `2px solid ${content.color_primary || "#333"}`,
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: content.color_primary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🔔 City Wallet
            </span>
            <span style={{ fontSize: 10, color: "#999" }}>just now</span>
          </div>

          {/* Offer content */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{content.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: content.color_primary, lineHeight: 1.2 }}>
                {content.headline}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                {merchant.name} · {content.discount_percent}% off · {Math.round(merchant.distance_m || 80)}m
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{
                flex: 1,
                padding: "10px 0",
                background: content.color_primary || "#333",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: accepting ? "wait" : "pointer",
              }}
            >
              {accepting ? "Accepting..." : `${content.cta_text || "Accept"} ✓`}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                color: "#999",
                border: "1px solid #ddd",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Dismiss ✕
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
