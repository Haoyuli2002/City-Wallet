// Merchant icon set
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Icon = ({ size = 18, children }) => (<svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>{children}</svg>);

const M = {
  Dashboard: () => <Icon><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></Icon>,
  Rules: () => <Icon><path d="M4 6h16M4 12h16M4 18h10"/></Icon>,
  Money: () => <Icon><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12" r="3"/></Icon>,
  Settings: () => <Icon><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></Icon>,
  Plus: () => <Icon><path d="M12 5v14M5 12h14"/></Icon>,
  Close: () => <Icon><path d="M6 6l12 12M6 18L18 6"/></Icon>,
  Rain: () => <Icon><path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A4 4 0 0 0 5 15"/><path d="M8 19v2M12 17v4M16 19v2"/></Icon>,
  Sun: () => <Icon><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></Icon>,
  Clock: () => <Icon><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></Icon>,
  Pin: () => <Icon><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Crowd: () => <Icon><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 7 0"/></Icon>,
  Calendar: () => <Icon><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></Icon>,
};
window.M = M;
