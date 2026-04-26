// App.jsx — main consumer wallet, click-thru prototype.
const { useState, useEffect } = React;

function App() {
  const [tab, setTab] = useState('home');
  const [view, setView] = useState('home'); // home | sheet | confirm
  const [secs, setSecs] = useState(24 * 60); // 24:00 countdown

  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} Min.`;

  const offer = {
    trigger: 'ES REGNET · 11 °C',
    triggerIcon: I.Rain,
    headline: '−15 %',
    subject: 'Cappuccino',
    place: 'Café Lotte',
    distance: '80 m',
    until: '13:00',
    countdown: fmt(secs),
  };

  const moreOffers = [
    { headline: '−10 %', subject: 'Mittagsteller', place: 'Bistro Neuwerk · 240 m' },
    { headline: '2 für 1', subject: 'Brötchen', place: 'Bäckerei Junge · 350 m' },
    { headline: '−20 %', subject: 'Buchhandlung', place: 'Felix Jud · 410 m' },
  ];

  const history = [
    { icon: I.Coffee, subject: 'Cappuccino · −15 %', place: 'Café Lotte', time: 'Heute, 12:47', amount: '0,80' },
    { icon: I.Cart,   subject: 'Wocheneinkauf · −5 €', place: 'EDEKA Eppendorf', time: 'Gestern, 18:12', amount: '5,00' },
    { icon: I.Coffee, subject: 'Espresso · 2 für 1', place: 'Balzac Coffee', time: '23.04., 10:04', amount: '2,40' },
    { icon: I.Cart,   subject: 'Drogerie · −10 %', place: 'dm Mönckebergstr.', time: '21.04., 16:30', amount: '3,18' },
  ];

  const [settings, setSettings] = useState({
    push: true,
    location: true,
    onDevice: true,
    history: false,
  });
  const tog = k => () => setSettings(s => ({ ...s, [k]: !s[k] }));

  const renderHome = () => (
    <div className="scroll">
      <OfferWidget {...offer} onRedeem={() => setView('sheet')} />
      <div className="section-h">In Ihrer Nähe</div>
      {moreOffers.map((o, i) => <MiniOffer key={i} {...o} />)}
      <div className="privacy-strip">
        <I.Lock />
        Standort & Wetter werden auf Ihrem Gerät verarbeitet. Es werden keine Bewegungsdaten an Sparkasse gesendet.
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="scroll">
      <div className="section-h">Diesen Monat · 11,38 € Cashback</div>
      {history.map((h, i) => <ReceiptRow key={i} {...h} />)}
    </div>
  );

  const renderProfile = () => (
    <div className="scroll">
      <div className="profile-head">
        <div className="avatar">AS</div>
        <div>
          <div className="name">Anna Schmidt</div>
          <div className="iban">DE89 2005 0550 1234 5678 90</div>
        </div>
      </div>
      <div className="section-h">Mitteilungen</div>
      <SettingRow icon={I.Bell} title="Push-Mitteilungen" sub="Bei passenden Angeboten" value={settings.push} onToggle={tog('push')} />
      <SettingRow icon={I.Pin} title="Standort" sub="Nur im Vordergrund" value={settings.location} onToggle={tog('location')} />
      <div className="section-h">Datenschutz</div>
      <SettingRow icon={I.Lock} title="Verarbeitung auf Gerät" sub="Empfohlen" value={settings.onDevice} onToggle={tog('onDevice')} />
      <SettingRow icon={I.Globe} title="Anonymisierten Verlauf teilen" sub="Hilft, Angebote zu verbessern" value={settings.history} onToggle={tog('history')} />
      <div className="section-h">Über</div>
      <SettingRow icon={I.User} title="Sprache" sub="Deutsch" hasToggle={false} />
      <SettingRow icon={I.Receipt} title="Nutzungsbedingungen" hasToggle={false} />
    </div>
  );

  const renderOffers = () => (
    <div className="scroll">
      <div className="section-h">Aktiv · 4 Angebote</div>
      <OfferWidget {...offer} onRedeem={() => setView('sheet')} />
      {moreOffers.map((o, i) => <MiniOffer key={i} {...o} />)}
    </div>
  );

  return (
    <Phone>
      <AppBar />
      {tab === 'home' && renderHome()}
      {tab === 'offers' && renderOffers()}
      {tab === 'history' && renderHistory()}
      {tab === 'profile' && renderProfile()}
      <BottomNav active={tab} onChange={(t) => { setTab(t); setView('home'); }} />

      {view === 'sheet' && (
        <RedeemSheet
          offer={offer}
          countdown={fmt(secs)}
          onClose={() => setView('home')}
          onConfirm={() => setView('confirm')}
        />
      )}
      {view === 'confirm' && (
        <div className="sheet-backdrop" style={{ background: '#fff' }}>
          <div style={{ width: '100%', height: '100%', background: '#fff' }}>
            <Confirmation
              subject="Cappuccino · Café Lotte"
              amount="0,80"
              time={new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              txId="TX-7HX94K"
              onDone={() => { setView('home'); setTab('history'); }}
            />
          </div>
        </div>
      )}
    </Phone>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
