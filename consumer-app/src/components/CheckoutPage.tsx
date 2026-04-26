"use client";

import { useState, useEffect } from "react";
import TabBar from "@/components/TabBar";
import { getOffer, type OfferResponse } from "@/lib/api";
import { getActiveOfferIds, removeActiveOffer } from "@/lib/store";

function useCountdown(expiresAt: string) {
  const getRemaining = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
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

function OfferItem({ offerId }: { offerId: string }) {
  const [offer, setOffer] = useState<OfferResponse | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getOffer(offerId)
      .then(o => {
        if (o.status !== "accepted") {
          removeActiveOffer(offerId);
          setError(true);
        } else {
          setOffer(o);
        }
      })
      .catch(() => {
        removeActiveOffer(offerId);
        setError(true);
      });
  }, [offerId]);

  const { seconds, label: timeLabel } = useCountdown(offer?.expires_at ?? new Date(Date.now() + 999999).toISOString());
  const isExpired = offer && seconds === 0;

  useEffect(() => {
    if (isExpired) removeActiveOffer(offerId);
  }, [isExpired, offerId]);

  if (error) return null;
  if (!offer) return (
    <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-tertiary)" }}>
      Loading offer…
    </div>
  );
  if (isExpired) return null;

  const { content, merchant } = offer;
  const isUrgent = seconds < 120;

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 28, flexShrink: 0 }}>{content.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{merchant.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {content.headline} · -{content.discount_percent}%
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 13,
            color: "#16a34a",
            fontWeight: 600,
          }}>
            ⏱ {timeLabel}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
            {offer.token?.slice(0, 16)}…
          </div>
        </div>
        <span style={{ color: "var(--text-tertiary)", fontSize: 18, marginLeft: 4 }}>
          {expanded ? "▾" : "›"}
        </span>
      </button>

      {/* Expanded: QR code */}
      {expanded && offer.qr_code && (
        <div style={{
          padding: "0 16px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 16,
          background: content.color_background || "#fff",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: content.color_primary }}>
            {content.headline}
          </div>
          <div style={{ fontSize: 13, color: "#555", textAlign: "center" }}>{content.subtext}</div>

          {/* QR Code image */}
          <div style={{ padding: 12, background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <img
              src={offer.qr_code}
              alt="QR Code"
              style={{ width: 200, height: 200, display: "block" }}
            />
          </div>

          {/* Token */}
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--text-tertiary)", letterSpacing: "0.06em",
            textAlign: "center",
          }}>
            {offer.token}
          </div>

          {/* Show this at merchant */}
          <div style={{
            padding: "10px 16px",
            background: content.color_primary,
            color: "#fff",
            borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 600, textAlign: "center",
            width: "100%",
          }}>
            Show this at {merchant.name}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple deterministic QR-like pattern generator for demo
function generateQRPattern(data: string): string {
  const hash = data.split("").reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
  const size = 21;
  const cells: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      // Fixed position detection patterns (corners)
      if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)) {
        const pr = r < 7 ? r : r - (size - 7);
        const pc = c < 7 ? c : c - (size - 7);
        if (pr === 0 || pr === 6 || pc === 0 || pc === 6) return true;
        if (pr >= 2 && pr <= 4 && pc >= 2 && pc <= 4) return true;
        return false;
      }
      // Data cells - deterministic based on hash
      const idx = r * size + c;
      return ((hash >> (idx % 32)) & 1) === 1 || (idx % 3 === 0 && r % 2 === 0);
    })
  );

  const cell = 8;
  const pad = 16;
  const total = size * cell + pad * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">`;
  svg += `<rect width="${total}" height="${total}" fill="white"/>`;
  cells.forEach((row, r) => {
    row.forEach((on, c) => {
      if (on) {
        svg += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="#0a0a0a"/>`;
      }
    });
  });
  svg += "</svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Mock offers with 1-week validity for demo
const ONE_WEEK = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const MOCK_OFFERS: OfferResponse[] = [
  {
    id: "mock_001",
    merchant: { id: "mock_m1", name: "Café Glockenspiel", category: "cafe", address: "Marienplatz 28, Munich", lat: 48.1369, lon: 11.5752, rating: 4.6 },
    content: {
      headline: "Cold outside? ☕",
      subtext: "Your cappuccino is waiting at Café Glockenspiel, just 80m away.",
      discount_percent: 15,
      original_item: "cappuccino",
      cta_text: "Warm Up Now",
      mood: "cozy",
      color_primary: "#8B4513",
      color_background: "#FFF8DC",
      color_accent: "#D2691E",
      icon: "☕",
      valid_minutes: 10080,
      reasoning: "Cold weather + browsing for food + quiet café",
    },
    status: "accepted",
    created_at: new Date().toISOString(),
    expires_at: ONE_WEEK,
    qr_code: generateQRPattern("CW-2026-mock001demo"),
    token: "CW-2026-mock001demo",
  },
  {
    id: "mock_002",
    merchant: { id: "mock_m2", name: "Rischart am Marienplatz", category: "bakery", address: "Marienplatz 18, Munich", lat: 48.1368, lon: 11.5760, rating: 4.4 },
    content: {
      headline: "Fresh from the oven 🥖",
      subtext: "Enjoy 20% off your pastry at Rischart — baked this morning.",
      discount_percent: 20,
      original_item: "pastry",
      cta_text: "Grab a Pastry",
      mood: "warm",
      color_primary: "#DAA520",
      color_background: "#FFFACD",
      color_accent: "#FFD700",
      icon: "🥖",
      valid_minutes: 10080,
      reasoning: "End of morning rush + bakery quiet hours",
    },
    status: "accepted",
    created_at: new Date().toISOString(),
    expires_at: ONE_WEEK,
    qr_code: generateQRPattern("CW-2026-mock002demo"),
    token: "CW-2026-mock002demo",
  },
];

function MockOfferItem({ offer }: { offer: OfferResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { content, merchant, expires_at } = offer;
  const getRemaining = () => Math.max(0, Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setSeconds(getRemaining()), 60000); // update every minute
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expires_at]);
  const days = Math.floor(seconds / 86400);
  const timeLabel = days > 0 ? `${days}d left` : `${Math.floor(seconds / 3600)}h left`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <button onClick={() => setExpanded(!expanded)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{content.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{merchant.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{content.headline} · -{content.discount_percent}%</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#16a34a", fontWeight: 600 }}>⏱ {timeLabel}</div>
          <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{offer.token}</div>
        </div>
        <span style={{ color: "var(--text-tertiary)", fontSize: 18, marginLeft: 4 }}>{expanded ? "▾" : "›"}</span>
      </button>
      {expanded && (
        <div style={{ padding: "0 16px 20px", paddingTop: 16, borderTop: "1px solid var(--border-subtle)", background: content.color_background, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: content.color_primary }}>{content.headline}</div>
          <div style={{ fontSize: 13, color: "#555", textAlign: "center" }}>{content.subtext}</div>
          <div style={{ padding: 12, background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <img src={offer.qr_code} alt="QR Code" style={{ width: 180, height: 180, display: "block" }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.06em", textAlign: "center" }}>{offer.token}</div>
          <div style={{ padding: "10px 16px", background: content.color_primary, color: "#fff", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, textAlign: "center", width: "100%" }}>
            Show this at {merchant.name}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const [offerIds, setOfferIds] = useState<string[]>([]);

  useEffect(() => {
    setOfferIds(getActiveOfferIds());
  }, []);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "14px 20px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>City Wallet</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
          My Offers
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 10 }}>

        <>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>
            Tap to show QR code
          </div>
          {/* Mock demo offers */}
          {MOCK_OFFERS.map(offer => (
            <MockOfferItem key={offer.id} offer={offer} />
          ))}
          {/* Real accepted offers */}
          {offerIds.map(id => (
            <OfferItem key={id} offerId={id} />
          ))}
          {offerIds.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 20px", color: "var(--text-tertiary)", fontSize: 12, fontStyle: "italic" }}>
              Accept offers from the Explore tab to add more
            </div>
          )}
        </>
      </div>
      <TabBar />
    </div>
  );
}
