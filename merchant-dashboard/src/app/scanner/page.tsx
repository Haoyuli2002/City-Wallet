"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import { redeemOffer } from "@/lib/api";
import { getSavedMerchant } from "@/lib/store";

type RedeemResult = {
  status: string;
  discount_applied?: number;
  cashback_credited?: number;
  wallet_new_balance?: number;
  message?: string;
};

export default function ScannerPage() {
  const [merchantName, setMerchantName] = useState<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("4.50");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    const m = getSavedMerchant();
    if (m) setMerchantName(m.name);
  }, []);

  const handleRedeem = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await redeemOffer(token.trim(), parseFloat(amount) || 0);
      setResult(res);
      if (res.status === "redeemed") setToken("");
    } catch {
      setResult({ status: "error", message: "Connection error. Check backend is running." });
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = result?.status === "redeemed";
  const isError   = result && !isSuccess;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>
      <TopBar merchantName={merchantName} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Header */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>
            Redemption
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em" }}>Scan QR Code</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Validate customer offers and apply discounts
          </div>
        </div>

        {/* QR Viewfinder */}
        <div style={{
          background: "var(--ink)", borderRadius: "var(--radius-lg)", padding: "32px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative",
        }}>
          {[
            { top: 16, left: 16, borderTop: "3px solid #fff", borderLeft: "3px solid #fff" },
            { top: 16, right: 16, borderTop: "3px solid #fff", borderRight: "3px solid #fff" },
            { bottom: 16, left: 16, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff" },
            { bottom: 16, right: 16, borderBottom: "3px solid #fff", borderRight: "3px solid #fff" },
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: 24, height: 24, borderRadius: 2, ...style }} />
          ))}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              Point camera at customer QR code
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              Camera scanning coming soon
            </div>
          </div>
        </div>

        {/* Manual token input */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>
            Enter Token Manually
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Redemption Token</label>
            <input
              type="text" value={token} onChange={e => setToken(e.target.value)}
              placeholder="CW-2026-..."
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontSize: 14, fontFamily: "var(--font-mono)", background: "var(--surface-muted)", letterSpacing: "0.04em" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Transaction Amount (€)</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0.01} step={0.5}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", background: "var(--surface-muted)" }}
            />
          </div>

          <button
            onClick={handleRedeem}
            disabled={loading || !token.trim()}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "var(--border-default)" : "var(--ink)",
              color: loading ? "var(--text-tertiary)" : "#fff",
              border: "none", borderRadius: "var(--radius-md)",
              fontSize: 14, fontWeight: 600,
              cursor: loading || !token.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Validating…" : "Redeem Offer"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            background: isSuccess ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "var(--radius-lg)", padding: "20px 18px",
          }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>
              {isSuccess ? "✅" : "❌"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", color: isSuccess ? "#15803d" : "#dc2626", marginBottom: isSuccess ? 16 : 8 }}>
              {isSuccess ? "Offer Redeemed!" : "Redemption Failed"}
            </div>

            {isSuccess && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Discount applied",  value: `€${result.discount_applied?.toFixed(2)}` },
                  { label: "Cashback credited", value: `€${result.cashback_credited?.toFixed(2)}` },
                  { label: "Customer wallet",   value: `€${result.wallet_new_balance?.toFixed(2)}` },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i > 0 ? "1px solid #d1fae5" : undefined }}>
                    <span style={{ fontSize: 13, color: "#166534" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d", fontFamily: "var(--font-mono)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div style={{ fontSize: 13, color: "#dc2626", textAlign: "center" }}>
                {result.message || "Invalid or expired token"}
              </div>
            )}

            <button
              onClick={() => { setResult(null); setToken(""); }}
              style={{ width: "100%", marginTop: 14, padding: "11px", border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`, background: "transparent", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500, color: isSuccess ? "#15803d" : "#dc2626", cursor: "pointer" }}
            >
              {isSuccess ? "Scan next" : "Try again"}
            </button>
          </div>
        )}

        {/* Token format hint */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>Token format</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>CW-2026-xxxxxxxxxxxxxxxx</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Tokens are valid for the duration shown on the customer app</div>
        </div>

      </div>
      <TabBar />
    </div>
  );
}
