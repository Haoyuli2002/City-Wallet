// Patch broken Node v25 localStorage before Next.js renders anything
export async function register() {
  if (typeof globalThis !== "undefined") {
    const ls = (globalThis as Record<string, unknown>).localStorage;
    if (ls && typeof (ls as Record<string, unknown>).getItem !== "function") {
      // Node v25 has a broken localStorage stub - replace with a no-op
      (globalThis as Record<string, unknown>).localStorage = {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
        clear: () => undefined,
        key: () => null,
        length: 0,
      };
    }
  }
}
