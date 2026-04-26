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
import { formatDistance, formatEuro, formatPercent } from "@/lib/format";
import type { Offer } from "@/lib/types";
import type { OfferProtocol, OfferComponent, Theme } from "@/lib/genui/protocol";
import { HEADLINES, SUBHEADLINES, CTAS, t } from "@/lib/genui/copy";
import { IMAGES, gradientCss } from "@/lib/genui/images";

interface DynamicCardProps {
  protocol: OfferProtocol;
  reasons: Offer["reasons"];
  /** "mock" | "webllm" — shown as a tiny chip so demo viewers see the source. */
  selectorSource?: string;
}

const THEME_BG: Record<Theme, string> = {
  "sparkassen-warm":      "#FFF8F0",
  "sparkassen-cool":      "#FFFFFF",
  "sparkassen-energetic": "#FFF4E8",
};

export function DynamicCard({ protocol, reasons, selectorSource }: DynamicCardProps) {
  const router = useRouter();
  const [showReasons, setShowReasons] = useState(false);
  const [pending, startTransition] = useTransition();
  const lang = protocol.language;

  function onAccept() {
    startTransition(async () => {
      const accepted = await acceptOffer(protocol.offer_id);
      if (accepted) router.push(`/redeem/${accepted.id}`);
    });
  }

  function onDismiss() {
    startTransition(async () => {
      await dismissOffer(protocol.offer_id);
      router.push("/home");
    });
  }

  const cardStyle = { background: THEME_BG[protocol.theme] };

  const hero = protocol.components.find((c) => c.type === "HeroImage");
  const hasReasonBadge = protocol.components.some((c) => c.type === "AIReasonBadge");
  const padBlocks = protocol.components.filter((c) => c.type !== "HeroImage" && c.type !== "AIReasonBadge");

  return (
    <article className="offer" style={cardStyle} data-tone={protocol.tone} data-layout={protocol.layout}>
      <div className="offer__strip" />
      <header className="offer__top">
        <button className="icon-btn" type="button" aria-label="Schließen" onClick={onDismiss}>
          <CloseIcon />
        </button>
        <div className="offer__top-right">
          {selectorSource ? (
            <span className="genui-source" title={`Selector: ${selectorSource}`}>
              {selectorSource === "webllm" ? "🧠 on-device" : "⚙ mock"}
            </span>
          ) : null}
          {hasReasonBadge ? (
            <button className="ai-badge" type="button" onClick={() => setShowReasons(true)}>
              <SparkleIcon />
              KI · Warum das?
            </button>
          ) : null}
        </div>
      </header>

      {hero && hero.type === "HeroImage" ? <HeroImage image_key={hero.image_key} /> : null}

      <div className="offer__pad">
        {padBlocks.map((c, i) => <PadBlock key={i} c={c} lang={lang} onAccept={onAccept} onDismiss={onDismiss} pending={pending} />)}
      </div>

      {showReasons ? <ReasonsSheet reasons={reasons} onClose={() => setShowReasons(false)} /> : null}
    </article>
  );
}

function HeroImage({ image_key }: { image_key: keyof typeof IMAGES }) {
  const img = IMAGES[image_key];
  return (
    <div
      className="offer__hero offer__hero--genui"
      role="img"
      aria-label={img.alt_de}
      style={{ background: gradientCss(image_key) }}
    >
      <span className="offer__hero-glyph" aria-hidden="true">{img.glyph}</span>
    </div>
  );
}

interface PadBlockProps {
  c: OfferComponent;
  lang: OfferProtocol["language"];
  onAccept: () => void;
  onDismiss: () => void;
  pending: boolean;
}

function PadBlock({ c, lang, onAccept, onDismiss, pending }: PadBlockProps) {
  switch (c.type) {
    case "TriggerPill":
      return (
        <span className="trigger-pill">
          <RainIcon />
          {t(HEADLINES, c.label_key, lang)} · {Math.round(c.temp_celsius)} °C
        </span>
      );
    case "Headline":
      return <h2 className="offer__headline">{t(HEADLINES, c.text_key, lang)}</h2>;
    case "Subheadline":
      return <p className="offer__sub">{t(SUBHEADLINES, c.text_key, lang)}</p>;
    case "MerchantMeta":
      return (
        <>
          <div className="divider" />
          <div className="meta-row">
            <span>{c.merchant_name}</span>
            <span className="sep">·</span>
            <span>{formatDistance(c.distance_m)}</span>
            <span className="sep">·</span>
            <span className="discount">{formatPercent(c.discount_percent)}</span>
          </div>
        </>
      );
    case "Validity":
      return (
        <div className="validity">
          <ClockIcon />
          Gültig {c.valid_minutes} Min.
        </div>
      );
    case "CashbackBadge":
      return (
        <div className="cashback">
          <span className="cashback__icon"><CheckIcon /></span>
          <div>
            Du erhältst <span className="cashback__amount">{formatEuro(c.amount_eur)}</span> Cashback
          </div>
        </div>
      );
    case "ActionButtons":
      return (
        <>
          <div className="divider" />
          <button className="cta" type="button" disabled={pending} onClick={onAccept}>
            {pending ? "Wird geladen …" : t(CTAS, c.primary_cta_key, lang)}
          </button>
          <button className="cta-secondary" type="button" disabled={pending} onClick={onDismiss}>
            {t(CTAS, c.secondary_cta_key, lang)}
          </button>
          <div className="gdpr">
            <LockIcon />
            Lokal auf deinem Gerät verarbeitet
          </div>
        </>
      );
    case "HeroImage":
    case "AIReasonBadge":
      return null;
  }
}
