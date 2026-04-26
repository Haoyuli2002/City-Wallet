// Icons.jsx — small Lucide-style outline icon set used across the kit.
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Icon = ({ size = 20, children }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>{children}</svg>
);

const I = {
  Rain:    () => <Icon><path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A4 4 0 0 0 5 15"/><path d="M8 19v2M12 17v4M16 19v2"/></Icon>,
  Sun:     () => <Icon><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></Icon>,
  Clock:   () => <Icon><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></Icon>,
  Pin:     () => <Icon><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Lock:    () => <Icon><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  Check:   () => <Icon><path d="M5 12l5 5L20 7"/></Icon>,
  Grid:    () => <Icon><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Icon>,
  Tag:     () => <Icon><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></Icon>,
  Receipt: () => <Icon><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></Icon>,
  User:    () => <Icon><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  Bell:    () => <Icon><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V11a6 6 0 1 0-12 0v3a2 2 0 0 1-.6 1.6L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></Icon>,
  Coffee:  () => <Icon><path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2M14 3v2"/></Icon>,
  Cart:    () => <Icon><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l3 12h11l2-8H6"/></Icon>,
  Globe:   () => <Icon><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  Chevron: () => <Icon><path d="M9 6l6 6-6 6"/></Icon>,
};

window.I = I;
