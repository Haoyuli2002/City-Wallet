import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { RedeemScreen } from "@/components/RedeemScreen";
import { acceptOffer, getOffer } from "@/lib/api";
import type { AcceptedOffer } from "@/lib/types";

export default async function RedeemPage({ params }: { params: { id: string } }) {
  const offer = await getOffer(params.id);
  if (!offer) notFound();

  const accepted: AcceptedOffer =
    offer.status === "accepted" || offer.status === "redeemed"
      ? (offer as AcceptedOffer)
      : ((await acceptOffer(offer.id)) as AcceptedOffer);

  return (
    <PhoneFrame dark>
      <StatusBar light />
      <RedeemScreen offer={accepted} />
      <HomeIndicator light />
    </PhoneFrame>
  );
}
