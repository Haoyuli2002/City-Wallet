"use client";

interface TopBarProps {
  merchantName?: string;
  onScan?: () => void;
}

export default function TopBar({ merchantName, onScan }: TopBarProps) {
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
    </div>
  );
}
