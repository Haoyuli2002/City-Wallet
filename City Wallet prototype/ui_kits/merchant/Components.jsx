// Merchant components

const Sidebar = ({ active, onChange }) => {
  const items = [
    { id: 'overview', label: 'Übersicht', Icn: M.Dashboard },
    { id: 'rules', label: 'Regeln', Icn: M.Rules },
    { id: 'settle', label: 'Abrechnung', Icn: M.Money },
    { id: 'settings', label: 'Einstellungen', Icn: M.Settings },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark"><div className="row r1"></div><div className="row r2"></div><div className="row r3"></div><div className="v1"></div><div className="v2"></div></div>
        <div>
          <div className="product">City Wallet</div>
          <div className="role">Merchant Konsole</div>
        </div>
      </div>
      {items.map(({ id, label, Icn }) => (
        <div key={id} className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          <Icn /> {label}
        </div>
      ))}
      <div className="merchant">
        <div className="ava">CL</div>
        <div>
          <div className="nm">Café Lotte</div>
          <div className="em">Eppendorfer Landstr. 41</div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, sub, primary, onPrimary }) => (
  <div className="topbar">
    <div>
      <h1>{title}</h1>
      <div className="sub">{sub}</div>
    </div>
    <div className="actions">
      <button className="btn ghost">Vorschau</button>
      {primary ? <button className="btn primary" onClick={onPrimary}>{primary}</button> : null}
    </div>
  </div>
);

const Kpi = ({ label, value, delta, accent, neg }) => (
  <div className={`kpi ${accent ? 'accent' : ''}`}>
    <div className="lbl">{label}</div>
    <div className="val">{value}</div>
    {delta ? <div className={`delta ${neg ? 'neg' : ''}`}>{delta}</div> : null}
  </div>
);

const Chart = () => {
  const data = [12, 18, 22, 19, 25, 31, 28, 36, 42, 38, 47, 53, 49, 58];
  const max = Math.max(...data);
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return (
    <>
      <div className="chart">
        {data.map((v, i) => (
          <div key={i} className={`bar ${i === data.length - 1 ? 'red' : ''}`} style={{ height: `${(v / max) * 100}%` }}></div>
        ))}
      </div>
      <div className="chart" style={{ height: 'auto', borderBottom: 'none', paddingTop: 8 }}>
        {days.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--fg-3)' }}>{d}</div>)}
      </div>
    </>
  );
};

const Activity = () => {
  const rows = [
    { h: '0,80 € Cashback · Cappuccino −15 %', s: 'Anna S. · Regen-Trigger', t: '12:47' },
    { h: '0,80 € Cashback · Cappuccino −15 %', s: 'Markus B. · Regen-Trigger', t: '12:31' },
    { h: '1,20 € Cashback · Mittagsteller', s: 'Sara K. · Mittagspause-Trigger', t: '12:19' },
    { h: '0,80 € Cashback · Cappuccino −15 %', s: 'Tobias W. · Regen-Trigger', t: '11:58' },
    { h: 'Regel "Kaffee bei Regen" aktiv', s: 'Wetter: Hamburg, 11 °C, Regen', t: '11:30' },
  ];
  return (
    <div className="feed">
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <div className="dot"></div>
          <div className="body"><div className="h">{r.h}</div><div className="s">{r.s}</div></div>
          <div className="t">{r.t}</div>
        </div>
      ))}
    </div>
  );
};

const RulesTable = ({ rules, onToggle, onEdit }) => (
  <div className="rules">
    <div className="head">
      <div>Regel</div>
      <div>Trigger</div>
      <div>Einlösungen</div>
      <div>Cashback</div>
      <div>Aktiv</div>
    </div>
    {rules.map((r, i) => (
      <div className="row" key={i} onClick={() => onEdit(r)}>
        <div className="name">{r.name}<span className="sub">−{r.discount} % auf {r.subject}</span></div>
        <div className="triggers">
          {r.triggers.map((t, j) => <span key={j} className={`chip ${t.red ? 'red' : ''}`}>{t.label}</span>)}
        </div>
        <div className="num">{r.redemptions}<span className="sub">diese Woche</span></div>
        <div className="num">{r.cashback} €<span className="sub">ausgezahlt</span></div>
        <div onClick={(e) => { e.stopPropagation(); onToggle(i); }}>
          <div className={`toggle ${r.active ? '' : 'off'}`}></div>
        </div>
      </div>
    ))}
  </div>
);

const SettlementsTable = () => {
  const rows = [
    { date: '24.04.2026', desc: 'Wochenabrechnung KW 17', count: 142, gross: '186,40', fee: '5,59', net: '180,81', status: 'ok' },
    { date: '17.04.2026', desc: 'Wochenabrechnung KW 16', count: 118, gross: '154,20', fee: '4,63', net: '149,57', status: 'ok' },
    { date: '10.04.2026', desc: 'Wochenabrechnung KW 15', count: 96, gross: '124,80', fee: '3,74', net: '121,06', status: 'ok' },
    { date: '03.04.2026', desc: 'Wochenabrechnung KW 14', count: 81, gross: '108,30', fee: '3,25', net: '105,05', status: 'ok' },
    { date: '27.03.2026', desc: 'Wochenabrechnung KW 13', count: 74, gross: '94,60', fee: '2,84', net: '91,76', status: 'ok' },
    { date: 'Nächste', desc: 'Wochenabrechnung KW 18', count: 38, gross: '49,40', fee: '1,48', net: '47,92', status: 'pending' },
  ];
  return (
    <div className="tbl">
      <div className="h">
        <div>Datum</div><div>Beschreibung</div><div className="num">Einlösungen</div><div className="num">Brutto</div><div className="num">Netto</div><div>Status</div>
      </div>
      {rows.map((r, i) => (
        <div className="r" key={i}>
          <div>{r.date}</div>
          <div>{r.desc}</div>
          <div className="num">{r.count}</div>
          <div className="num">{r.gross} €</div>
          <div className="num"><b>{r.net} €</b></div>
          <div><span className={`status-pill ${r.status === 'ok' ? 'ok' : 'pending'}`}>{r.status === 'ok' ? 'Ausgezahlt' : 'In Vorbereitung'}</span></div>
        </div>
      ))}
    </div>
  );
};

const RuleEditor = ({ rule, onClose, onSave }) => {
  const [discount, setDiscount] = React.useState(rule?.discount ?? 15);
  const [subject, setSubject] = React.useState(rule?.subject ?? 'heiße Getränke');
  const [triggers, setTriggers] = React.useState(rule?.activeTriggers ?? ['rain', 'lunch']);
  const t = (k) => () => setTriggers(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const has = (k) => triggers.includes(k);
  const opts = [
    { k: 'rain', label: 'Regen', Icn: M.Rain },
    { k: 'sun', label: 'Sonne > 22 °C', Icn: M.Sun },
    { k: 'lunch', label: 'Mittag (11–14 Uhr)', Icn: M.Clock },
    { k: 'evening', label: 'Feierabend (17–19)', Icn: M.Clock },
    { k: 'nearby', label: 'Kunde < 200 m', Icn: M.Pin },
    { k: 'crowd', label: 'Hohe Frequenz', Icn: M.Crowd },
  ];
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mhead">
          <h2>{rule ? 'Regel bearbeiten' : 'Neue Regel'}</h2>
          <button className="btn ghost" onClick={onClose} style={{ padding: 6, width: 32, height: 32, display:'flex', alignItems:'center', justifyContent:'center' }}><M.Close /></button>
        </div>
        <div className="mbody">
          <div>
            <div className="field">
              <label>Name</label>
              <input value={rule?.name ?? 'Kaffee bei Regen'} readOnly />
            </div>
            <div className="field-row">
              <div className="field"><label>Rabatt</label><input value={`-${discount} %`} onChange={e => setDiscount(parseInt(e.target.value) || 0)} /></div>
              <div className="field"><label>Maximale Einlösungen / Tag</label><input value="40" /></div>
            </div>
            <div className="field"><label>Gültig für</label><input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="field"><label>Trigger (UND-verknüpft)</label>
              <div className="trigger-grid">
                {opts.map(({ k, label, Icn }) => (
                  <div key={k} className={`trigger-opt ${has(k) ? 'active' : ''}`} onClick={t(k)}><Icn /> {label}</div>
                ))}
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Gültig ab</label><input value="01.04.2026" /></div>
              <div className="field"><label>Gültig bis</label><input value="30.06.2026" /></div>
            </div>
          </div>
          <div className="preview-phone">
            <div className="lbl">Live-Vorschau</div>
            <div className="mock">
              <div className="strip"></div>
              <div className="pad">
                <span className="pill">☔ ES REGNET · 11 °C</span>
                <div className="hero">−{discount} %</div>
                <div className="subj">{subject}</div>
                <div className="place">Café Lotte · 80 m · bis 13:00</div>
                <button className="cta">Einlösen</button>
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.5 }}>
              So sehen Kunden mit aktiven Triggern Ihr Angebot. Reichweite heute geschätzt <b style={{ color: 'var(--fg-1)' }}>≈ 320 Personen</b>.
            </div>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn primary" onClick={onSave}>Regel speichern</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Sidebar, Topbar, Kpi, Chart, Activity, RulesTable, SettlementsTable, RuleEditor });
