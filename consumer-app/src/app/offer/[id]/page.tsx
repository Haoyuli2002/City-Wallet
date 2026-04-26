import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { AppTopBar } from "@/components/AppTopBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { OfferHero } from "@/components/OfferHero";
import { getOffer } from "@/lib/api";

export default async function OfferPage({ params }: { params: { id: string } }) {
  const offer = await getOffer(params.id);
  if (!offer) notFound();

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <AppTopBar context="Stuttgart" />
        <div className="app__body">
          <OfferHero offer={offer} />
        </div>
        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
