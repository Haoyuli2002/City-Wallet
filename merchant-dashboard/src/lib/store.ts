// Safe localStorage wrapper for Next.js SSR + Node v25 compatibility

function safeStorage() {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== "function") return null;
    return ls;
  } catch {
    return null;
  }
}

export function getSavedMerchant(): { id: string; name: string } | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const saved = storage.getItem("cw_merchant");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveMerchant(id: string, name: string) {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem("cw_merchant", JSON.stringify({ id, name }));
  } catch {
    // ignore quota errors
  }
}

export function clearMerchant() {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem("cw_merchant");
  } catch {
    // ignore
  }
}
