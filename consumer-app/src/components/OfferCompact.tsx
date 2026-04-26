import Link from "next/link";
import { ChevronIcon } from "./Icons";
import { formatDistance, formatPercent } from "@/lib/format";
import type { Offer } from "@/lib/types";

interface OfferCompactProps {
  offer: Offer;
}

export function OfferCompact({ offer }: OfferCompactProps) {
  return (
    <Link href={`/offer/${offer.id}`} className="offer-compact" aria-label={`Angebot von ${offer.merchant.name} öffnen`}>
      <div className="offer-compact__strip" />
      <div className="offer-compact__img">340×200</div>
      <div className="offer-compact__body">
        <span className="offer-compact__pill">{offer.trigger_label}</span>
        <h4 className="offer-compact__title">{offer.content.original_item}</h4>
        <div className="offer-compact__meta">
          <span>{offer.merchant.name}</span>
          <span className="sep">·</span>
          <span>{formatDistance(offer.merchant.distance_m)}</span>
          <span className="sep">·</span>
          <span className="discount">{formatPercent(offer.content.discount_percent)}</span>
        </div>
        <span className="offer-compact__chev"><ChevronIcon /></span>
      </div>
    </Link>
  );
}
