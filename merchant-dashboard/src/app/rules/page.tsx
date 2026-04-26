"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import { getMerchant, updateRules, type MerchantRules } from "@/lib/api";
import { getSavedMerchant } from "@/lib/store";

const TARGETS = [
  { value: "fill_quiet_hours", label: "Fill quiet hours", desc: "Triggers when transaction volume drops below the hourly average. AI pushes offers to attract passing customers during slow periods." },
  { value: "lunch_rush",       label: "Lunch rush",       desc: "Active between 11:30–14:00. AI generates time-sensitive lunch offers to compete for midday foot traffic." },
  { value: "rainy_day_special",label: "Rainy day special", desc: "Triggers when weather is rainy or below 12°C. AI creates warm, shelter-focused offers for people seeking refuge from the weather." },
  { value: "end_of_day_clearance", label: "End of day clearance", desc: "Active in the afternoon/evening. AI promotes remaining inventory before closing time. Great for bakeries." },
  { value: "early_bird_special",   label: "Early bird special",   desc: "Triggers in the early morning hours. AI rewards customers who visit early to build a loyal morning crowd." },
];

const TONES = [
  { value: "cozy",         label: "Cozy" },
  { value: "professional", label: "Professional" },
  { value: "energetic",    label: "Energetic" },
  { value: "warm",         label: "Warm" },
];

const ALL_PRODUCTS = [
  "hot_drinks", "cold_drinks", "pastries", "lunch_menu",
  "bread", "cakes", "drinks", "snacks", "books", "stationery", "gifts",
];

export default function RulesPage() {
  const [merchant, setMerchant] = useState<{ id: string; name: string } | null>(null);
  const [rules, setRules] = useState<MerchantRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flippedTarget, setFlippedTarget] = useState<string | null>(null);

  // Form state
  const [maxDiscount, setMaxDiscount] = useState(15);
  const [target, setTarget] = useState("fill_quiet_hours");
  const [tone, setTone] = useState("cozy");
  const [budget, setBudget] = useState(50);
  const [products, setProducts] = useState<string[]>(["all"]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const saved = getSavedMerchant();
    if (saved) {
      setMerchant(saved);
      getMerchant(saved.id)
        .then(({ rules: r }) => {
          setRules(r);
          setMaxDiscount(r.max_discount_percent);
          setTarget(r.target);
          setTone(r.brand_tone);
          setBudget(r.daily_budget_eur);
          const scope = typeof r.product_scope === "string"
            ? JSON.parse(r.product_scope)
            : (r.product_scope || ["all"]);
          setProducts(scope);
          setIsActive(r.is_active);
        })
        .catch((e) => {
          console.error(e);
          // Stale merchant ID - reset
          if (typeof window !== "undefined") window.localStorage.removeItem("cw_merchant");
          setMerchant(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const toggleProduct = (p: string) => {
    setProducts(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev.filter(x => x !== "all"), p]
    );
  };

  const handleSave = async () => {
    if (!merchant) return;
    setSaving(true);
    try {
      await updateRules(merchant.id, {
        max_discount_percent: maxDiscount,
        target,
        brand_tone: tone,
        daily_budget_eur: budget,
        product_scope: products,
        is_active: isActive,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!merchant) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
          No store selected. Go to Performance tab first.
        </div>
      </div>
    );
  }

  const sectionStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)" as const,
    padding: "18px 16px",
  };
  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 10 as const,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--text-tertiary)",
    marginBottom: 12,
    display: "block",
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>
      <style>{`
        .tc-wrap { perspective: 800px; height: 52px; }
        .tc-inner { position: relative; width: 100%; height: 52px; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1); transform-style: preserve-3d; }
        .tc-inner.flipped { transform: rotateY(180deg); }
        .tc-front, .tc-back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .tc-back { transform: rotateY(180deg); }
      `}</style>
      <TopBar merchantName={merchant.name} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Header */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>
            AI Rules
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em" }}>Discount Rules</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Set constraints. AI creates the offer.
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)", fontSize: 14 }}>Loading rules…</div>
        ) : (
          <>
            {/* Active toggle */}
            <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>AI Offers Active</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {isActive ? "AI is generating offers" : "Offers are paused"}
                </div>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                style={{
                  width: 48, height: 26,
                  borderRadius: 13,
                  background: isActive ? "var(--ink)" : "var(--border-default)",
                  border: "none", cursor: "pointer",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 3, left: isActive ? 25 : 3,
                  width: 20, height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            {/* Max Discount */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Max Discount</span>
              <div style={{ display: "flex", gap: 8 }}>
                {[5, 10, 15, 20, 25, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setMaxDiscount(d)}
                    style={{
                      flex: 1, padding: "10px 0",
                      border: "1px solid",
                      borderColor: maxDiscount === d ? "var(--ink)" : "var(--border-default)",
                      background: maxDiscount === d ? "var(--ink)" : "var(--surface)",
                      color: maxDiscount === d ? "#fff" : "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12, fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                    }}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-tertiary)" }}>
                Budget spent today: <strong>€{rules?.budget_spent_today?.toFixed(2) ?? "0.00"}</strong> of <strong>€{budget}</strong>
              </div>
            </div>

            {/* Target */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Target</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {TARGETS.map(t => {
                  const isSel = target === t.value;
                  const isFlip = flippedTarget === t.value;
                  return (
                    <div key={t.value} className="tc-wrap">
                      <div className={`tc-inner${isFlip ? " flipped" : ""}`}>
                        <div className="tc-front" onClick={() => setTarget(t.value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: 52, border: "1px solid", borderColor: isSel ? "var(--ink)" : "var(--border-default)", background: isSel ? "var(--ink)" : "var(--surface)", color: isSel ? "#fff" : "var(--text-secondary)", borderRadius: "var(--radius-md)", cursor: "pointer", userSelect: "none" as const }}>
                          <span style={{ fontSize: 13, fontWeight: isSel ? 600 : 400 }}>{t.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {isSel && <span style={{ fontSize: 12 }}>✓</span>}
                            <button onClick={e => { e.stopPropagation(); setFlippedTarget(isFlip ? null : t.value); }} title="What is this?" style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${isSel ? "rgba(255,255,255,0.5)" : "var(--text-tertiary)"}`, background: "transparent", color: isSel ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>i</button>
                          </div>
                        </div>
                        <div className="tc-back" onClick={() => setFlippedTarget(null)} style={{ display: "flex", alignItems: "center", padding: "0 14px", height: 52, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                          <span style={{ fontSize: 11.5, color: "#1e40af", lineHeight: 1.4 }}>{t.desc}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Brand Tone */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Brand Tone</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: "8px 14px",
                      border: "1px solid",
                      borderColor: tone === t.value ? "var(--ink)" : "var(--border-default)",
                      background: tone === t.value ? "var(--ink)" : "var(--surface)",
                      color: tone === t.value ? "#fff" : "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12, fontWeight: tone === t.value ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Budget */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Daily Budget</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)" }}>€</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  min={10} max={500} step={10}
                  style={{
                    flex: 1, padding: "12px 14px",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 20, fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    background: "var(--surface-muted)",
                  }}
                />
              </div>
            </div>

            {/* Product Scope */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Product Scope</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_PRODUCTS.map(p => {
                  const active = products.includes(p) || products.includes("all");
                  return (
                    <button
                      key={p}
                      onClick={() => toggleProduct(p)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid",
                        borderColor: active ? "var(--ink)" : "var(--border-default)",
                        background: active ? "var(--ink)" : "var(--surface)",
                        color: active ? "#fff" : "var(--text-secondary)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      {p.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%", padding: "14px",
                background: saved ? "var(--green)" : "var(--ink)",
                color: "#fff", border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: 14, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "background 0.2s",
              }}
            >
              {saving ? "Saving…" : saved ? "✓ Rules saved!" : "Save Rules"}
            </button>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
