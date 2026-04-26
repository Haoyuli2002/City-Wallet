"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import MerchantSelector from "@/components/MerchantSelector";
import { getAnalytics, getFeed, type AnalyticsData, type FeedEvent } from "@/lib/api";
import { getSavedMerchant, saveMerchant } from "@/lib/store";

export default function PerformancePage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<{ id: string; name: string } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    const saved = getSavedMerchant();
    if (saved) setMerchant(saved);
  }, []);

  const loadData = useCallback(async (id: string, p: string) => {
    setLoading(true);
    try {
      const [a, f] = await Promise.all([getAnalytics(id, p), getFeed(id)]);
      setAnalytics(a);
      setFeed(f.events || []);
    } catch (e) {
      console.error(e);
      // Merchant not found (stale ID after re-seed) — reset to selector
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("cw_merchant");
      }
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (merchant) loadData(merchant.id, period);
  }, [merchant, period, loadData]);

  if (!merchant) {
    return (
      <MerchantSelector onSelect={(id, name) => { saveMerchant(id, name); setMerchant({ id, name }); }} />
    );
  }

  const funnel = analytics?.funnel;
  const rates  = analytics?.rates;
  const rev    = analytics?.revenue;

  const pushed   = funnel?.generated ?? 0;
  const viewed   = funnel?.displayed ?? 0;
  const accepted = funnel?.accepted ?? 0;
  const redeemed = funnel?.redeemed ?? 0;
  // "Expired" here = accepted but never came in to redeem (no-shows)
  // Backend's funnel.expired counts offers no one responded to (before accept stage)
  // So we compute from accepted directly:
  const notUsed  = Math.max(0, accepted - redeemed); // accepted but not redeemed
  const expired  = notUsed;   // alias for display
  const remain   = 0;          // no "pending" in historical data

  const FUNNEL_STEPS = [
    { key: "pushed",   label: "Pushed",   icon: "📤", color: "#3b82f6", value: pushed,   sub: false },
    { key: "viewed",   label: "Viewed",   icon: "👁️", color: "#6366f1", value: viewed,   sub: false },
    { key: "accepted", label: "Accepted", icon: "✅", color: "#16a34a", value: accepted, sub: false },
    { key: "redeemed", label: "Redeemed", icon: "📱", color: "#e63946", value: redeemed, sub: true  },
    { key: "expired",  label: "Expired",  icon: "⏰", color: "#f59e0b", value: expired,  sub: true  },
    { key: "remain",   label: "Remain",   icon: "⏳", color: "#a8a29e", value: remain,   sub: true  },
  ];

  const maxBar = Math.max(...FUNNEL_STEPS.map(s => s.value), 1);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>
      <TopBar merchantName={merchant.name} onScan={() => router.push("/scanner")} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)", borderRadius: "var(--radius-lg)", padding: "20px 18px", border: "1px solid #93c5fd" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1e40af", display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span>Net Earnings via City Wallet</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1d4ed8" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63946", display: "inline-block" }} />
              Live
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "#1e3a8a" }}>
            {loading ? "—" : `€ ${(rev?.estimated_incremental_revenue ?? 0).toFixed(2)}`}
          </div>
          {/* <div style={{ fontSize: 13, color: "#1e40af", marginTop: 6 }}>
            {loading ? "Loading…" : `Net Incremental · ${redeemed} redemptions · €${(rev?.total_transaction_value ?? 0).toFixed(2)} − €${(rev?.total_discount_given ?? 0).toFixed(2)}`}
          </div> */}
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["today", "week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: "9px 0", border: "1px solid",
              borderColor: period === p ? "#3b82f6" : "var(--border-default)",
              background: period === p ? "#3b82f6" : "var(--surface)",
              color: period === p ? "#fff" : "var(--text-secondary)",
              borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-mono)", cursor: "pointer",
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Offer Funnel */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>Offer Funnel</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#3b82f6", marginBottom: 14 }}>Accepted = Redeemed + Expired + Remain</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FUNNEL_STEPS.map(step => {
              const pct = Math.round((step.value / maxBar) * 100);
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: step.sub ? 16 : 0 }}>
                  {step.sub && <span style={{ color: "var(--text-tertiary)", fontSize: 10, marginLeft: -12, marginRight: 2, flexShrink: 0 }}>└</span>}
                  <div style={{ width: step.sub ? 72 : 80, fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span>{step.icon}</span>
                    <span style={{ fontWeight: step.key === "accepted" ? 600 : 400 }}>{step.label}</span>
                  </div>
                  <div style={{ flex: 1, height: step.sub ? 6 : 8, background: "var(--surface-muted)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: step.color, width: `${loading ? 0 : pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ width: 32, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: step.key === "accepted" ? 700 : 600, color: step.key === "accepted" ? "#16a34a" : "var(--text-primary)" }}>
                    {loading ? "—" : step.value}
                  </div>
                </div>
              );
            })}
            {/* {!loading && accepted > 0 && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", fontSize: 11, color: "#15803d", fontFamily: "var(--font-mono)" }}>
                {accepted} accepted = {redeemed} redeemed + {expired} expired + {remain} remaining
              </div>
            )} */}
          </div>
        </div>

        {/* Conversion Rates */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Conversion Rates</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Acceptance", value: rates?.acceptance_rate, color: "#16a34a", bg: "#f0fdf4" },
              { label: "Redemption", value: rates?.redemption_rate, color: "#16a34a", bg: "#f0fdf4" },
              { label: "Conversion",  value: rates?.conversion_rate, color: "#16a34a", bg: "#f0fdf4" },
            ].map(r => (
              <div key={r.label} style={{ flex: 1, background: r.bg, borderRadius: "var(--radius-md)", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                  {loading ? "—" : `${Math.round((r.value ?? 0) * 100)}%`}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Revenue Breakdown</div>
          {[
            { label: "Total transaction value",   val: rev?.total_transaction_value,       pfx: "€",  red: false, bold: false },
            { label: "Discount given",            val: rev?.total_discount_given,          pfx: "-€", red: true,  bold: false },
            { label: "Net incremental",           val: rev?.estimated_incremental_revenue, pfx: "€",  red: false, bold: true  },
            { label: "Discount per order",      val: rev?.cost_per_acquisition,          pfx: "€",  red: false, bold: false },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
              <span style={{ fontSize: row.bold ? 16 : 14, fontWeight: row.bold ? 700 : 600, color: row.red ? "var(--brand-red)" : row.bold ? "var(--green)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
                {loading ? "—" : `${row.pfx}${(row.val ?? 0).toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Live Feed
          </div>
          {feed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-tertiary)", fontSize: 13 }}>
              {loading ? "Loading…" : "No events yet"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {feed.slice(0, 12).map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", width: 40, flexShrink: 0, paddingTop: 2 }}>{ev.timestamp}</span>
                  <span style={{ fontSize: 14 }}>{ev.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, lineHeight: 1.4 }}>{ev.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Switch store */}
        <button
          onClick={() => { localStorage.removeItem("cw_merchant"); setMerchant(null); }}
          style={{ padding: "12px", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", fontSize: 13, color: "var(--text-tertiary)", cursor: "pointer" }}
        >
          Switch store
        </button>

      </div>
      <TabBar />
    </div>
  );
}
