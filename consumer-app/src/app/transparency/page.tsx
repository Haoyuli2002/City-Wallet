"use client";

import Link from "next/link";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { BottomTabBar } from "@/components/BottomTabBar";

interface PairRow {
  yes: string;
  yesNote?: string;
  no: string;
}

const PAIRS: PairRow[] = [
  { yes: "Stadtteil", yesNote: "z. B. „Stuttgart-Mitte\"", no: "Adresse, GPS, Wegverlauf" },
  { yes: "Tageszeit · Wochentag", yesNote: "öffentlicher Kontext", no: "Name, E-Mail, Telefon" },
  { yes: "Wetter", yesNote: "von DWD-API, anonym", no: "Zahlungs- und Bankdaten" },
  { yes: "Bewegungstempo", yesNote: "steht · geht · fährt", no: "Inhalte aus anderen Apps" },
  { yes: "Angenommene Angebote", yesNote: "letzte 90 Tage", no: "Daten von Werbenetzwerken" },
  { yes: "Eigene Vorlieben", yesNote: "z. B. „vegetarisch\"", no: "Geschlecht, Alter, Herkunft, Religion" },
];

interface LogEntry {
  time: string;
  miss?: boolean;
  verdict: string;
  item: string;
  reasons: string[];
}

const LOG: LogEntry[] = [
  {
    time: "14:08",
    verdict: "Vorgeschlagen:",
    item: "Cappuccino · Café Lotte",
    reasons: ["Stuttgart-Mitte", "11 °C", "Regen", "geht · 80 m"],
  },
  {
    time: "13:42",
    miss: true,
    verdict: "Nicht angezeigt:",
    item: "Eis · Eismanufaktur",
    reasons: ["Wetter unter 15 °C", "Regel: kein Eis bei Regen"],
  },
  {
    time: "12:30",
    verdict: "Vorgeschlagen:",
    item: "Mittagsmenü · Bäckerei Klein",
    reasons: ["Stuttgart-Mitte", "Mittagszeit", "Stammkundin · 6 Besuche"],
  },
  {
    time: "11:14",
    miss: true,
    verdict: "Nicht angezeigt:",
    item: "Bier · Brauhaus",
    reasons: ["Vorliebe: kein Alkohol"],
  },
  {
    time: "09:55",
    verdict: "Vorgeschlagen:",
    item: "Apfelkuchen · Café Müller",
    reasons: ["Stuttgart-Mitte", "Stammkundin", "Werktags-Frequenz hoch"],
  },
  {
    time: "08:12",
    miss: true,
    verdict: "Nicht angezeigt:",
    item: "Yoga-Kurs · Studio Ost",
    reasons: ["außerhalb Stadtteil", "fährt"],
  },
];

export default function TransparencyPage() {
  const [paused, setPaused] = useState(false);

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <div className="settings-head">
          <Link href="/settings" className="settings-head__back" aria-label="Zurück zu Einstellungen">
            <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <div>
            <div className="settings-head__crumb">Einstellungen</div>
            <div className="settings-head__title">KI-Transparenz</div>
          </div>
        </div>

        <div className="app__body" style={{ padding: 0 }}>
          <div className="hero-claim">
            <div className="hero-claim__law">EU-Verordnung 2024/1689 · Art. 13</div>
            <h2 className="hero-claim__head">
              Die KI kennt deinen<br />
              <span className="knows">Stadtteil</span>,<br />
              nicht deine <span className="knows-not">Adresse</span>.
            </h2>
            <p className="hero-claim__sub">
              System mit begrenztem Risiko nach EU-KI-VO. Du hast das Recht zu wissen, was rein- und was rausgeht — und beides hier zu sehen.
            </p>
          </div>

          <div className="pair-table">
            <div className="pair-table__head">
              <div className="pair-table__col pair-table__col--yes"><span>✓</span>Verarbeitet</div>
              <div className="pair-table__col pair-table__col--no"><span>✕</span>Nie verarbeitet</div>
            </div>
            {PAIRS.map((p, i) => (
              <div key={i} className="pair-row">
                <div className="pair-cell">
                  {p.yes}
                  {p.yesNote ? <em>{p.yesNote}</em> : null}
                </div>
                <div className="pair-cell pair-cell--no">{p.no}</div>
              </div>
            ))}
          </div>

          <div className="log-section">
            <div className="log-head">
              <h3>Letzte Entscheidungen für dich</h3>
              <span className="log-head__meta">heute · 6 Vorgänge</span>
            </div>
            <div className="log">
              {LOG.map((row) => (
                <div key={row.time} className={`log__row${row.miss ? " log__row--miss" : ""}`}>
                  <span className="log__time">{row.time}</span>
                  <div className="log__main">
                    <div className="log__verdict">
                      {row.verdict} <b>{row.item}</b>
                    </div>
                    <div className="log__because">
                      {row.reasons.map((r) => <span key={r}>{r}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="guarantee">
            <div className="guarantee__head">Diskriminierungsfreiheit · § 4</div>
            <p className="guarantee__text">
              Das System trifft keine Entscheidungen anhand von Geschlecht, Alter, Herkunft, Religion, Gesundheit oder politischer Einstellung. Diese Merkmale werden weder erhoben noch abgeleitet. Eine externe Prüfstelle bestätigt das jährlich.
            </p>
          </div>

          <div className="pause-card">
            <div>
              <p className="pause-card__title">KI-Empfehlungen pausieren</p>
              <p className="pause-card__sub">
                Du erhältst weiter Angebote — aber rein chronologisch, ohne Personalisierung.
              </p>
            </div>
            <button
              type="button"
              className={`switch${paused ? " switch--on" : ""}`}
              aria-label="KI pausieren"
              aria-pressed={paused}
              onClick={() => setPaused((v) => !v)}
            />
          </div>

          <div className="sec-actions">
            <button className="sec-actions__btn" type="button">
              <span>
                <span className="sec-actions__btn-title">Beschwerde einreichen</span>
                <span className="sec-actions__btn-sub">Marktaufsicht · Art. 85 EU-KI-VO</span>
              </span>
              <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <button className="sec-actions__btn" type="button">
              <span>
                <span className="sec-actions__btn-title">Daten exportieren</span>
                <span className="sec-actions__btn-sub">Art. 15 DSGVO · alles, was wir verarbeiten</span>
              </span>
              <svg viewBox="0 0 24 24"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
            </button>
            <button className="sec-actions__btn" type="button">
              <span>
                <span className="sec-actions__btn-title">Mehr zur EU-KI-Verordnung</span>
                <span className="sec-actions__btn-sub">eur-lex.europa.eu · Volltext</span>
              </span>
              <svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </button>
          </div>

          <div className="audit">
            <span><b>Modell-ID</b> cw-reco-v3.1</span>
            <span><b>Letzte Prüfung</b> 14.06.2025</span>
            <span><b>Prüfstelle</b> TÜV Süd</span>
            <span><b>Verantwortlich</b> City Wallet GmbH</span>
          </div>
        </div>

        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
