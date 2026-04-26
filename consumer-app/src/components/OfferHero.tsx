"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckIcon,
  CloseIcon,
  ClockIcon,
  LockIcon,
  RainIcon,
  SparkleIcon,
} from "./Icons";
import { ReasonsSheet } from "./ReasonsSheet";
import { acceptOffer, dismissOffer } from "@/lib/api";
import {
  formatDistance,
  formatEuro,
  formatPercent,
} from "@/lib/format";
import type { Offer } from "@/lib/types";

interface OfferHeroProps {
  offer: Offer;
}

export function OfferHero({ offer }: OfferHeroProps) {
  const router = useRouter();
  const [showReasons, setShowReasons] = useState(false);
  const [pending, startTransition] = useTransition();

  function onRedeem() {
    startTransition(async () => {
      const accepted = await acceptOffer(offer.id);
      if (accepted) router.push(`/redeem/${accepted.id}`);
    });
  }

  function onDismiss() {
    startTransition(async () => {
      await dismissOffer(offer.id);
      router.push("/home");
    });
  }

  return (
    <article className="offer">
      <div className="offer__strip" />
      <header className="offer__top">
        <button className="icon-btn" type="button" aria-label="Schließen" onClick={onDismiss}>
          <CloseIcon />
        </button>
        <button className="ai-badge" type="button" onClick={() => setShowReasons(true)}>
          <SparkleIcon />
          KI · Warum das?
        </button>
      </header>

      <div className="offer__hero" role="img" aria-label="Bildplatzhalter">
        <span className="offer__hero-corner">340 × 200 · placeholder</span>
        <span className="offer__hero-label">{offer.content.original_item} · Café-Innenraum</span>
      </div>

      <div className="offer__pad">
        <span className="trigger-pill">
          <RainIcon />
          {offer.trigger_label}
        </span>

        <h2 className="offer__headline">{offer.content.headline}</h2>
        <p className="offer__sub">{offer.content.subtext}</p>

        <div className="divider" />

        <div className="meta-row">
          <span>{offer.merchant.name}</span>
          <span className="sep">·</span>
          <span>{formatDistance(offer.merchant.distance_m)}</span>
          <span className="sep">·</span>
          <span className="discount">{formatPercent(offer.content.discount_percent)}</span>
        </div>

        <div className="validity">
          <ClockIcon />
          Gültig {offer.content.valid_minutes} Min.
        </div>

        <div className="cashback">
          <span className="cashback__icon"><CheckIcon /></span>
          <div>
            Du erhältst <span className="cashback__amount">{formatEuro(offer.cashback_eur)}</span> Cashback
          </div>
        </div>

        <div className="divider" />

        <button className="cta" type="button" disabled={pending} onClick={onRedeem}>
          {pending ? "Wird geladen …" : offer.content.cta_text}
        </button>
        <button className="cta-secondary" type="button" disabled={pending} onClick={onDismiss}>
          Nicht jetzt
        </button>

        <div className="gdpr">
          <LockIcon />
          Lokal auf deinem Gerät verarbeitet
        </div>
      </div>

      {showReasons ? <ReasonsSheet reasons={offer.reasons} onClose={() => setShowReasons(false)} /> : null}
    </article>
  );
}
