// Components.jsx — UI primitives for the City Wallet consumer kit.

const Phone = ({ children }) => (
  <div className="phone">
    <StatusBar />
    {children}
  </div>
);

const StatusBar = () => (
  <div className="statusbar">
    <span>9:41</span>
    <div className="right">
      <svg viewBox="0 0 24 24"><path d="M2 17h2v3H2zM6 14h2v6H6zM10 11h2v9h-2zM14 8h2v12h-2zM18 5h2v15h-2z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M2 8a14 14 0 0 1 20 0l-2 2a11 11 0 0 0-16 0zM5 11a10 10 0 0 1 14 0l-2 2a7 7 0 0 0-10 0zM8 14a6 6 0 0 1 8 0l-2 2a3 3 0 0 0-4 0zM12 19l-1.5 2h3z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M2 7h16v10H2zM18 10h2v4h-2z" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="9" width="11" height="6" fill="currentColor"/></svg>
    </div>
  </div>
);

const AppBar = ({ city = 'Hamburg', tempC = 11 }) => (
  <div className="appbar">
    <div className="brand">
      <div className="mark"><div className="row r1"></div><div className="row r2"></div><div className="row r3"></div><div className="v1"></div><div className="v2"></div></div>
      <div className="title">City Wallet</div>
    </div>
    <div className="meta">{city} · {tempC} °C</div>
  </div>
);

const BottomNav = ({ active, onChange }) => {
  const items = [
    { id: 'home', label: 'Heute', Icn: I.Grid },
    { id: 'offers', label: 'Angebote', Icn: I.Tag },
    { id: 'history', label: 'Verlauf', Icn: I.Receipt },
    { id: 'profile', label: 'Profil', Icn: I.User },
  ];
  return (
    <div className="bottomnav">
      {items.map(({ id, label, Icn }) => (
        <div key={id} className={`item ${active === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          <Icn />
          <div className="lbl">{label}</div>
        </div>
      ))}
    </div>
  );
};

const TriggerPill = ({ icon: Icn, children, neutral }) => (
  <span className={`trigger-pill ${neutral ? 'neutral' : ''}`}>
    {Icn ? <Icn /> : null}
    {children}
  </span>
);

const OfferWidget = ({ trigger, triggerIcon, headline, subject, place, distance, until, countdown, onRedeem }) => (
  <div className="offer">
    <div className="strip"></div>
    <div className="pad">
      <TriggerPill icon={triggerIcon}>{trigger}</TriggerPill>
      <div className="hero">{headline}</div>
      <div className="subject">{subject}</div>
      <div className="place"><I.Pin /> {place} · {distance} · bis {until}</div>
      <div className="countdown"><I.Clock /> noch {countdown}</div>
      <button className="cta" onClick={onRedeem}>Einlösen</button>
      <div className="gdpr"><I.Lock /> Verarbeitung auf Ihrem Gerät</div>
    </div>
  </div>
);

const MiniOffer = ({ headline, subject, place, onClick }) => (
  <div className="mini" onClick={onClick}>
    <div className="dot"></div>
    <div className="body">
      <div className="h">{subject}</div>
      <div className="s">{place}</div>
    </div>
    <div className="pct">{headline}</div>
  </div>
);

const QrPlaceholder = () => {
  // 12x12 deterministic pseudo-QR pattern
  const cells = [];
  let seed = 7;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    seed = (seed * 9301 + 49297) % 233280;
    const on = (seed / 233280) > 0.5;
    cells.push({ x, y, on });
  }
  // anchor squares (corners)
  const anchor = (x, y) => (
    <g key={`a${x}-${y}`}>
      <rect x={x} y={y} width="3" height="3" fill="#0A0A0A" />
      <rect x={x+0.6} y={y+0.6} width="1.8" height="1.8" fill="#fff" />
      <rect x={x+1.1} y={y+1.1} width="0.8" height="0.8" fill="#0A0A0A" />
    </g>
  );
  return (
    <svg viewBox="0 0 12 12" width="160" height="160" shapeRendering="crispEdges">
      {cells.filter(c => c.on && !((c.x < 3 && c.y < 3) || (c.x > 8 && c.y < 3) || (c.x < 3 && c.y > 8))).map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#0A0A0A" />
      ))}
      {anchor(0,0)}{anchor(9,0)}{anchor(0,9)}
    </svg>
  );
};

const RedeemSheet = ({ offer, countdown, onClose, onConfirm }) => (
  <div className="sheet-backdrop" onClick={onClose}>
    <div className="sheet" onClick={e => e.stopPropagation()}>
      <div className="grabber"></div>
      <h2>{offer.subject} · {offer.headline}</h2>
      <div className="place">{offer.place} · gültig bis {offer.until}</div>
      <div className="qr"><div className="qrgrid"><QrPlaceholder /></div></div>
      <div className="pin">9 4 7 1</div>
      <div className="pin-lbl">Code an der Kasse zeigen</div>
      <div className="countdown">⏱ Code läuft in {countdown} ab</div>
      <button className="secondary" onClick={onConfirm}>Eingelöst markieren</button>
    </div>
  </div>
);

const Confirmation = ({ subject, amount, time, txId, onDone }) => (
  <div className="confirm">
    <div className="check"><I.Check /></div>
    <h2>Eingelöst</h2>
    <div style={{ fontSize: 14, color: 'var(--fg-2)' }}>{subject} · {time}</div>
    <div className="amount">+{amount}&nbsp;€</div>
    <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>Cashback gutgeschrieben</div>
    <div className="meta">{txId}</div>
    <button className="done-btn" onClick={onDone}>Fertig</button>
  </div>
);

const ReceiptRow = ({ icon: Icn, subject, place, time, amount }) => (
  <div className="receipt">
    <div className="icn">{Icn ? <Icn /> : null}</div>
    <div className="body">
      <div className="h">{subject}</div>
      <div className="s">{place} · {time}</div>
    </div>
    <div className="amount">+{amount}&nbsp;€</div>
  </div>
);

const SettingRow = ({ icon: Icn, title, sub, value, onToggle, hasToggle = true }) => (
  <div className="setting-row">
    <div className="icn">{Icn ? <Icn /> : null}</div>
    <div className="body">
      <div className="h">{title}</div>
      {sub ? <div className="s">{sub}</div> : null}
    </div>
    {hasToggle ? (
      <div className={`toggle ${value ? '' : 'off'}`} onClick={onToggle}></div>
    ) : (
      <div style={{ color: 'var(--fg-3)' }}><I.Chevron /></div>
    )}
  </div>
);

Object.assign(window, { Phone, AppBar, BottomNav, TriggerPill, OfferWidget, MiniOffer, RedeemSheet, Confirmation, ReceiptRow, SettingRow });
