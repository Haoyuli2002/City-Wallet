"use client";

interface TopBarProps {
  merchantName?: string;
  onScan?: () => void;
  onLogout?: () => void;
}

export default function TopBar({ merchantName, onScan, onLogout }: TopBarProps) {
  return (
    <div style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border-default)",
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
          City Wallet
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 400,
            color: "var(--text-tertiary)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginLeft: 6,
          }}>
            · Merchant
          </span>
        </div>
        {merchantName && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            letterSpacing: "0.04em",
            marginTop: 1,
          }}>
            {merchantName}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onScan && (
          <button
            onClick={onScan}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
            aria-label="Scan QR code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM21 14v3M14 21h3M17 17h4" />
            </svg>
          </button>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              gap: 6,
              letterSpacing: "0.04em",
            }}
            aria-label="Switch store"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Switch
          </button>
        )}
      </div>
    </div>
  );
}
