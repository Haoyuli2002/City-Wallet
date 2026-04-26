function safeStorage() {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== "function") return null;
    return ls;
  } catch { return null; }
}

export function getActiveOfferIds(): string[] {
  const s = safeStorage();
  if (!s) return [];
  try {
    const raw = s.getItem("cw_active_offers");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addActiveOffer(offerId: string) {
  const s = safeStorage();
  if (!s) return;
  try {
    const ids = getActiveOfferIds();
    if (!ids.includes(offerId)) {
      s.setItem("cw_active_offers", JSON.stringify([offerId, ...ids]));
    }
  } catch {}
}

export function removeActiveOffer(offerId: string) {
  const s = safeStorage();
  if (!s) return;
  try {
    const ids = getActiveOfferIds().filter(id => id !== offerId);
    s.setItem("cw_active_offers", JSON.stringify(ids));
  } catch {}
}

export function getSavedCity(): string {
  const s = safeStorage();
  return s?.getItem("cw_city") ?? "munich";
}

export function saveCity(city: string) {
  safeStorage()?.setItem("cw_city", city);
}
