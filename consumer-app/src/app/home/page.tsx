import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { AppTopBar } from "@/components/AppTopBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SectionHeader } from "@/components/SectionHeader";
import { ContextTile } from "@/components/ContextTile";
import { OfferCompact } from "@/components/OfferCompact";
import { CloudIcon, PinIcon, ShopIcon, WalkIcon } from "@/components/Icons";
import { getContext, listLiveOffers } from "@/lib/api";

// Demo-fixed moment — keeps story time in sync with the 14:30 status bar
// and the "noch 14 Min." countdown in the prototypes.
const DEMO_DATE_LABEL = "Dienstag, 14. Oktober · 14:30";

export default async function StartPage() {
  const [ctx, offers] = await Promise.all([getContext(), listLiveOffers()]);

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <AppTopBar context="Stuttgart" />
        <div className="app__body">
          <h2 className="greet">Hi Mia</h2>
          <div className="greet__date">{DEMO_DATE_LABEL}</div>

          <SectionHeader title="Jetzt für dich" more="in Echtzeit" />
          <div className="context-grid">
            <ContextTile
              label="Wetter"
              icon={<CloudIcon />}
              primary={`${Math.round(ctx.weather.temp)} °C, ${ctx.weather.condition === "Rain" ? "Regen" : ctx.weather.condition}`}
              secondary={ctx.weather.description}
            />
            <ContextTile
              label="Ort"
              icon={<PinIcon />}
              primary="Königstraße"
              secondary="Altstadt"
            />
            <ContextTile
              label="Intent"
              icon={<WalkIcon />}
              primary="Du bummelst"
              secondary="langsam"
            />
            <ContextTile
              label="In der Nähe"
              icon={<ShopIcon />}
              primary={`${ctx.nearby_merchants.length + 11} Partner`}
              secondary="< 200 m"
            />
          </div>

          {offers.length > 0 ? (
            <>
              <SectionHeader title="Live-Angebot" more={`noch ${offers[0].content.valid_minutes} Min.`} />
              {offers.map((o) => <OfferCompact key={o.id} offer={o} />)}
            </>
          ) : (
            <>
              <SectionHeader title="Live-Angebot" />
              <div className="empty-state">Aktuell keine passenden Angebote.</div>
            </>
          )}
        </div>
        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
