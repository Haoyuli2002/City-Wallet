const { useState } = React;

const SAMPLE_RULES = [
  { name: 'Kaffee bei Regen', subject: 'heiße Getränke', discount: 15, triggers: [{ label: '☔ Regen', red: true }, { label: '⏱ 11–14 Uhr' }, { label: '📍 < 200 m' }], redemptions: 142, cashback: '186,40', active: true, activeTriggers: ['rain','lunch','nearby'] },
  { name: 'Mittagsteller', subject: 'Mittagsmenü', discount: 10, triggers: [{ label: '⏱ 12:00–13:30' }, { label: '📍 < 300 m' }], redemptions: 88, cashback: '124,80', active: true, activeTriggers: ['lunch','nearby'] },
  { name: 'Feierabend-Snack', subject: 'Gebäck nach 17:00', discount: 30, triggers: [{ label: '⏱ Feierabend' }, { label: '🥐 Bestand > 5' }], redemptions: 41, cashback: '38,20', active: true, activeTriggers: ['evening'] },
  { name: 'Sommer-Eiskaffee', subject: 'Iced Latte', discount: 20, triggers: [{ label: '☀ > 22 °C', red: true }, { label: '⏱ 14–17 Uhr' }], redemptions: 0, cashback: '0,00', active: false, activeTriggers: ['sun'] },
];

function App() {
  const [tab, setTab] = useState('overview');
  const [rules, setRules] = useState(SAMPLE_RULES);
  const [editing, setEditing] = useState(null);

  const toggle = (i) => setRules(rs => rs.map((r, idx) => idx === i ? { ...r, active: !r.active } : r));

  const Overview = () => (
    <>
      <Topbar
        title="Übersicht"
        sub="Heute · 24.04.2026 · Hamburg, 11 °C, Regen"
      />
      <div className="content">
        <div className="kpis">
          <Kpi label="Einlösungen heute" value="38" delta="↑ 24 % vs. Vorwoche" />
          <Kpi label="Cashback ausgezahlt" value="186,40 €" delta="↑ 12 %" />
          <Kpi label="Aktive Regeln" value="3" />
          <Kpi label="Conversion bei Regen" value="42 %" accent delta="↑ 8 pp" />
        </div>
        <div className="cards">
          <div className="card2">
            <h3>Einlösungen · 14 Tage</h3>
            <div className="csub">Heute hervorgehoben</div>
            <Chart />
          </div>
          <div className="card2">
            <h3>Aktivität</h3>
            <div className="csub">Letzte Stunde</div>
            <Activity />
          </div>
        </div>
        <div className="card2">
          <h3>Regelleistung</h3>
          <div className="csub">Diese Woche · klicken Sie eine Regel an, um sie zu bearbeiten</div>
          <div style={{ marginTop: 14 }}>
            <RulesTable rules={rules.slice(0, 3)} onToggle={toggle} onEdit={(r) => setEditing(r)} />
          </div>
        </div>
      </div>
    </>
  );

  const Rules = () => (
    <>
      <Topbar
        title="Regeln"
        sub={`${rules.filter(r => r.active).length} aktiv · ${rules.length} insgesamt`}
        primary="Neue Regel"
        onPrimary={() => setEditing({})}
      />
      <div className="content">
        <RulesTable rules={rules} onToggle={toggle} onEdit={(r) => setEditing(r)} />
        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
          Trigger-Auswertung erfolgt auf den Geräten Ihrer Kunden. Sparkasse erhält ausschließlich aggregierte Einlöseraten — keine Bewegungs- oder Wetterdaten einzelner Personen.
        </div>
      </div>
    </>
  );

  const Settle = () => (
    <>
      <Topbar title="Abrechnung" sub="Wöchentliche Auszahlung · IBAN DE89 2005 …5678" />
      <div className="content">
        <div className="kpis">
          <Kpi label="Nächste Auszahlung" value="47,92 €" delta="01.05.2026" />
          <Kpi label="Diesen Monat" value="463,21 €" delta="↑ 18 %" />
          <Kpi label="Servicegebühr" value="3,0 %" />
          <Kpi label="Offene Positionen" value="38" />
        </div>
        <SettlementsTable />
      </div>
    </>
  );

  const Settings = () => (
    <>
      <Topbar title="Einstellungen" sub="Konto · Standort · Benachrichtigungen" />
      <div className="content">
        <div className="card2" style={{ maxWidth: 720 }}>
          <h3>Café Lotte</h3>
          <div className="csub">Eppendorfer Landstraße 41 · 20251 Hamburg</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
            <div className="field"><label>Geschäftsname</label><input value="Café Lotte" readOnly /></div>
            <div className="field"><label>Branche</label><input value="Gastronomie · Café" readOnly /></div>
            <div className="field"><label>IBAN</label><input value="DE89 2005 0550 1234 5678 90" readOnly /></div>
            <div className="field"><label>USt-IdNr.</label><input value="DE 287 654 321" readOnly /></div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="shell">
        <Sidebar active={tab} onChange={setTab} />
        <main className="main">
          {tab === 'overview' && <Overview />}
          {tab === 'rules' && <Rules />}
          {tab === 'settle' && <Settle />}
          {tab === 'settings' && <Settings />}
        </main>
      </div>
      {editing !== null && (
        <RuleEditor rule={editing.name ? editing : null} onClose={() => setEditing(null)} onSave={() => setEditing(null)} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
