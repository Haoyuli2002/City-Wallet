interface StatusBarProps {
  time?: string;
  light?: boolean;
}

export function StatusBar({ time = "14:30", light = false }: StatusBarProps) {
  return (
    <div className={`statusbar${light ? " statusbar--light" : ""}`}>
      <div className="statusbar__notch" />
      <span>{time}</span>
      <div className="statusbar__icons">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7" width="2.5" height="4" rx="0.4" />
          <rect x="4" y="5" width="2.5" height="6" rx="0.4" />
          <rect x="8" y="3" width="2.5" height="8" rx="0.4" />
          <rect x="12" y="0" width="2.5" height="11" rx="0.4" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M1 4.5a9 9 0 0 1 12 0" />
          <path d="M3 6.5a6 6 0 0 1 8 0" />
          <path d="M5 8.5a3 3 0 0 1 4 0" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor" />
          <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

export function HomeIndicator({ light = false }: { light?: boolean }) {
  return (
    <div className={`home-indicator${light ? " home-indicator--light" : ""}`}>
      <span />
    </div>
  );
}
