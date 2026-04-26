# City Wallet — Consumer App Setup

Diese App ist eine Next.js 14 + React 18 Single-Page-App. `node_modules/` und
`.next/` werden absichtlich **nicht** mit eingecheckt — sie werden lokal aus
`package.json` neu erzeugt.

## Erststart

```bash
cd consumer-app
npm install        # ~30s, ~264 MB node_modules
npm run dev        # startet auf http://localhost:3000
```

Erste Seite: <http://localhost:3000/offer/offer_cappuccino_lunch>

## Was passiert beim Start

| Phase | Was passiert | Dauer |
|---|---|---|
| `npm install` | Lädt React, Next.js, `@mlc-ai/web-llm` (~10 MB inkl. WASM) | ~30s |
| `npm run dev` | Startet Next.js Dev-Server, kompiliert on-demand | ~3s + 2-3s pro Route |
| Erste `/offer/...`-Anfrage | Browser lädt Qwen2.5-0.5B-Modell von HuggingFace CDN nach IndexedDB | **~46s einmalig** |
| Zweite Anfrage (gleicher Browser) | Modell liegt in IndexedDB-Cache | ~5-15s zum Aufwärmen |

## Zur SLM-Modellgewichten

> **Wichtig**: Die ~350 MB Qwen2.5-0.5B-Gewichte sind **nicht** in diesem
> Repo — sie werden zur Laufzeit vom Browser geladen und im
> **IndexedDB-Cache** der Domain `localhost:3000` gespeichert. Im Dateisystem
> liegt davon nichts.

Das Modell wird identifiziert via `MODEL_ID` in
`src/lib/genui/webllm-selector.ts`:

```ts
const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
```

WebLLM löst diese ID gegen <https://huggingface.co/mlc-ai> auf und cached
Wasm + Gewichte über `@mlc-ai/web-llm` in IndexedDB.

### Cache vor Demo aufwärmen

Vor einer Live-Demo **einmal** `/offer/offer_cappuccino_lunch` öffnen und
warten bis der Chip von `🧠 lädt XX%` zu `🧠 on-device` wechselt. Danach
ist der Cache warm; jede weitere Demo lädt in <5s.

### Cache leeren

Chrome DevTools → Application → IndexedDB → `localhost:3000` →
`webllm/model_cache` → löschen.

## Voraussetzungen

- **Node.js ≥ 18** (Next.js 14 erfordert es)
- **Chrome/Edge mit WebGPU** (Safari unterstützt es noch nicht voll;
  Firefox nur hinter Flag). Ohne WebGPU greift der Mock-Selector — die App
  läuft, der Chip bleibt auf `⚙ mock`.
- ~500 MB freier Speicher: 264 MB für `node_modules`, 165 MB für `.next`
  Build-Cache nach erstem Run, ~50 MB für IndexedDB-Modellcache.

## Architektur — Kurzfassung

- **Server-Komponenten**: `src/app/**/page.tsx` — fetchen Daten via
  `src/lib/api.ts` Mock.
- **GenUI-Doppellayer**: `src/lib/genui/`
  - `protocol.ts` — JSON-Protokoll für Karten
  - `selector.ts` — Mock-Selector (Regelbasiert, sofort)
  - `webllm-selector.ts` — On-Device-SLM-Selector (Qwen2.5-0.5B)
  - `build.ts` — wandelt Selector-Output in Protokoll um
  - `prompts.ts` — Mikro-Multiple-Choice-Prompts an die SLM
  - `copy.ts` / `images.ts` — feste de/en-Texte und Bildschlüssel
- **Render**: `src/components/DynamicCard.tsx` rendert das Protokoll;
  `src/components/OfferRenderer.tsx` orchestriert Mock-zuerst,
  WebLLM-zweitens.

Siehe `prd.md` im Repo-Root für die Produktspezifikation.
