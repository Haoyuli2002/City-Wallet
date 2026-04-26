"use client";

import type { OfferReason } from "@/lib/types";
import { weightLabel } from "@/lib/format";
import { CloseIcon, RainIcon, ClockIcon, PulseIcon, HeartIcon, LockIcon } from "./Icons";

interface ReasonsSheetProps {
  reasons: OfferReason[];
  onClose: () => void;
}

const iconForKind: Record<OfferReason["kind"], () => JSX.Element> = {
  weather: () => <RainIcon />,
  time: () => <ClockIcon />,
  merchant: () => <PulseIcon />,
  preference: () => <HeartIcon />,
};

export function ReasonsSheet({ reasons, onClose }: ReasonsSheetProps) {
  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="reasons-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h3 id="reasons-title" className="sheet__title">Warum siehst du dieses Angebot?</h3>
          <button className="sheet__close" type="button" aria-label="Schließen" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <p className="sheet__lead">Die KI hat vier Signale kombiniert. Du kannst jedes Signal einzeln deaktivieren.</p>

        <ul className="reasons">
          {reasons.map((r, i) => {
            const Icon = iconForKind[r.kind];
            return (
              <li key={i}>
                <span className="reasons__icon"><Icon /></span>
                <span className="reasons__txt">
                  <span className="reasons__lbl">{r.label}</span>
                  <span className="reasons__val">{r.value}</span>
                </span>
                <span className="reasons__weight">{weightLabel(r.weight)}</span>
              </li>
            );
          })}
        </ul>

        <div className="privacy">
          <LockIcon />
          <div className="privacy__txt">
            <b>Lokal auf deinem Gerät verarbeitet</b>
            Wetter, Standort und Vorlieben verlassen dein Telefon nicht. Nur die finale Auswahl wird übermittelt — erst nach dem Einlösen.
          </div>
        </div>

        <div className="sheet__actions">
          <button className="sheet__btn" type="button">Diese Signale anpassen</button>
          <button className="sheet__btn sheet__btn--ghost" type="button">Solche Angebote nicht mehr zeigen</button>
        </div>
      </div>
    </div>
  );
}
