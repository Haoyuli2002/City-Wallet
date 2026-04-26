import os
base = "/Users/I761836/Desktop/City Wallet/merchant-dashboard"
path = os.path.join(base, "src/components/PerformancePage.tsx")

content = open(path).read()

# 1. Change hero background from black to light blue
content = content.replace(
    'background: "var(--ink)", color: "#fff", borderRadius: "var(--radius-lg)", padding: "20px 18px"',
    'background: "linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)", borderRadius: "var(--radius-lg)", padding: "20px 18px", border: "1px solid #93c5fd"'
)

# 2. Change hero label color
content = content.replace(
    'color: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between", marginBottom: 10',
    'color: "#1e40af", display: "flex", justifyContent: "space-between", marginBottom: 10'
)

# 3. Change Live dot colors in hero
content = content.replace(
    'display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)"',
    'display: "inline-flex", alignItems: "center", gap: 6, color: "#1d4ed8"'
)

# 4. Change hero number color
content = content.replace(
    'fontSize: 48, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, fontVariantNumeric: "tabular-nums"',
    'fontSize: 48, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "#1e3a8a"'
)

# 5. Change hero subtitle color
content = content.replace(
    'fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6',
    'fontSize: 13, color: "#1e40af", marginTop: 6'
)

# 6. Change period selector active color from ink to blue
content = content.replace(
    "borderColor: period === p ? \"var(--ink)\" : \"var(--border-default)\",\n              background: period === p ? \"var(--ink)\" : \"var(--surface)\",",
    "borderColor: period === p ? \"#3b82f6\" : \"var(--border-default)\",\n              background: period === p ? \"#3b82f6\" : \"var(--surface)\","
)

# 7. Replace FUNNEL_STEPS - remove Dismissed, add Remain
old_steps = '''  const FUNNEL_STEPS = [
    { key: "generated" as const, label: "Pushed",    icon: "📤", color: "#0a0a0a" },
    { key: "displayed" as const, label: "Viewed",    icon: "👁️", color: "#525252" },
    { key: "accepted"  as const, label: "Accepted",  icon: "✅", color: "#16a34a" },
    { key: "redeemed"  as const, label: "Redeemed",  icon: "📱", color: "#e63946" },
    { key: "dismissed" as const, label: "Dismissed", icon: "❌", color: "#a1a1aa" },
    { key: "expired"   as const, label: "Expired",   icon: "⏰", color: "#d4d4d8" },
  ];

  const maxBar = Math.max(...FUNNEL_STEPS.map(s => funnel?.[s.key] ?? 0), 1);'''

new_steps = '''  const pushed   = funnel?.generated ?? 0;
  const viewed   = funnel?.displayed ?? 0;
  const accepted = funnel?.accepted ?? 0;
  const redeemed = funnel?.redeemed ?? 0;
  const expired  = funnel?.expired ?? 0;
  const remain   = Math.max(0, accepted - redeemed - expired);

  const FUNNEL_STEPS = [
    { key: "pushed",    label: "Pushed",   icon: "📤", color: "#3b82f6", value: pushed,   sub: false },
    { key: "viewed",    label: "Viewed",   icon: "👁️", color: "#6366f1", value: viewed,   sub: false },
    { key: "accepted",  label: "Accepted", icon: "✅", color: "#16a34a", value: accepted, sub: false },
    { key: "redeemed",  label: "Redeemed", icon: "📱", color: "#e63946", value: redeemed, sub: true  },
    { key: "expired",   label: "Expired",  icon: "⏰", color: "#f59e0b", value: expired,  sub: true  },
    { key: "remain",    label: "Remain",   icon: "⏳", color: "#a8a29e", value: remain,   sub: true  },
  ];

  const maxBar = Math.max(...FUNNEL_STEPS.map(s => s.value), 1);'''

if old_steps in content:
    content = content.replace(old_steps, new_steps)
    print("✅ Replaced FUNNEL_STEPS")
else:
    print("⚠️  Could not find FUNNEL_STEPS to replace")
    # Try partial match
    if "Dismissed" in content:
        print("   'Dismissed' still present")

# 8. Replace funnel rendering - change from funnel?.[step.key] to step.value and add sub-indent
old_render = '''            {FUNNEL_STEPS.map(step => {
              const val = funnel?.[step.key] ?? 0;
              const pct = Math.round((val / maxBar) * 100);
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 80, fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span>{step.icon}</span><span>{step.label}</span>
                  </div>
                  <div style={{ flex: 1, height: 8, background: "var(--surface-muted)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: step.color, width: `${loading ? 0 : pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ width: 32, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
                    {loading ? "—" : val}
                  </div>
                </div>
              );
            })}'''

new_render = '''            {FUNNEL_STEPS.map(step => {
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
            {!loading && accepted > 0 && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", fontSize: 11, color: "#15803d", fontFamily: "var(--font-mono)" }}>
                {accepted} accepted = {redeemed} redeemed + {expired} expired + {remain} remaining
              </div>
            )}'''

if old_render in content:
    content = content.replace(old_render, new_render)
    print("✅ Replaced funnel render")
else:
    print("⚠️  Could not find funnel render to replace")

# 9. Add funnel label
old_funnel_label = '''          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Offer Funnel</div>'''
new_funnel_label = '''          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 4 }}>Offer Funnel</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#3b82f6", marginBottom: 14 }}>Accepted = Redeemed + Expired + Remain</div>'''

if old_funnel_label in content:
    content = content.replace(old_funnel_label, new_funnel_label)
    print("✅ Added funnel subtitle")

# 10. Update conversion rates colors
content = content.replace(
    '{ label: "Acceptance", value: rates?.acceptance_rate, color: "var(--green)" },\n              { label: "Redemption", value: rates?.redemption_rate, color: "var(--brand-red)" },\n              { label: "Conversion",  value: rates?.conversion_rate, color: "var(--ink)" },',
    '{ label: "Acceptance", value: rates?.acceptance_rate, color: "#16a34a", bg: "#f0fdf4" },\n              { label: "Redemption", value: rates?.redemption_rate, color: "#e63946", bg: "#fef2f2" },\n              { label: "Conversion",  value: rates?.conversion_rate, color: "#3b82f6", bg: "#eff6ff" },'
)
content = content.replace(
    'flex: 1, background: "var(--surface-muted)", borderRadius: "var(--radius-md)", padding: "12px 10px", textAlign: "center"',
    'flex: 1, background: r.bg, borderRadius: "var(--radius-md)", padding: "12px 10px", textAlign: "center"'
)

with open(path, "w") as f:
    f.write(content)

c = open(path).read()
print("\nVerification:")
print("  Has blue (#3b82f6):", "#3b82f6" in c)
print("  Has Remain:", "Remain" in c)
print("  Has Dismissed:", "Dismissed" in c)
print("  Has light blue hero:", "dbeafe" in c)
print("  File size:", len(c))
