"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, CloseIcon } from "./Icons";
import { QrPlaceholder } from "./QrPlaceholder";
import { markRedeemed } from "@/lib/api";
import { formatCountdown, formatEuro, formatClock, formatPercent } from "@/lib/format";
import type { AcceptedOffer } from "@/lib/types";

interface RedeemScreenProps {
  offer: AcceptedOffer;
}

export function RedeemScreen({ offer }: RedeemScreenProps) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(offer.status === "redeemed");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expiresAt = new Date(offer.expires_at).getTime();
  const remainingSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const expired = remainingSec === 0;

  function onConfirm() {
    if (confirmed || pending) return;
    startTransition(async () => {
      await markRedeemed(offer.id);
      setConfirmed(true);
    });
  }

  if (confirmed) {
    return (
      <div className="confirm">
        <div className="confirm__check"><CheckIcon /></div>
        <h2>Eingelöst</h2>
        <div className="confirm__sub">
          {offer.content.original_item} · {offer.merchant.name} · {formatClock(new Date())}
        </div>
        <div className="confirm__amount">{formatEuro(offer.cashback_eur, { sign: true })}</div>
        <div className="confirm__sub">Cashback gutgeschrieben</div>
        <div className="confirm__meta">{offer.token}</div>
        <Link className="confirm__done" href="/wallet">Fertig</Link>
      </div>
    );
  }

  return (
    <div className="qr-screen">
      <div className="qr-screen__top">
        <Link className="qr-screen__close" href="/home" aria-label="Schließen">
          <CloseIcon />
        </Link>
        <span className="qr-screen__pill">Live · 1 Code</span>
      </div>

      <div className="qr-screen__merchant">{offer.merchant.name}</div>
      <h2 className="qr-screen__title">
        {formatPercent(offer.content.discount_percent)} {offer.content.original_item}
      </h2>

      <div className="qr-screen__qrwrap" aria-label="QR-Code">
        <QrPlaceholder seed={offer.token} />
      </div>

      <div className="qr-screen__countdown">
        <div className="qr-screen__countdown-lbl">{expired ? "Abgelaufen" : "Gültig noch"}</div>
        <div className="qr-screen__countdown-val">{formatCountdown(remainingSec)}</div>
      </div>

      <div className="qr-screen__hint">
        <b>Zeig diesen Code an der Kasse.</b>
        <br />
        Nach dem Scan geht es automatisch zurück zum Wallet.
      </div>

      <button className="qr-screen__action" type="button" onClick={onConfirm} disabled={pending || expired}>
        {pending ? "Wird verbucht …" : "Eingelöst markieren"}
      </button>
    </div>
  );
}
