import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { AppTopBar } from "@/components/AppTopBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { OfferRenderer } from "@/components/OfferRenderer";
import { getOffer, getContext } from "@/lib/api";

export default async function OfferPage({ params }: { params: { id: string } }) {
  const [offer, context] = await Promise.all([getOffer(params.id), getContext()]);
  if (!offer) notFound();

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <AppTopBar context="Stuttgart" />
        <div className="app__body">
          <OfferRenderer offer={offer} context={context} />
        </div>
        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
