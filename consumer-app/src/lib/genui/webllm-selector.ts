// Real on-device selector backed by Qwen2.5-0.5B-Instruct via WebLLM.
// Uses the micro-multiple-choice strategy from PRD §11.2.3:
//   3 tasks × 1 token each = ~3 letters total.
// Anything else (free German text, JSON construction) stays on the
// deterministic side. We import @mlc-ai/web-llm dynamically so that nothing
// touches `navigator.gpu` during SSR.

import type { Selector, SelectorInput, SelectorOutput, Choice } from "./selector";
import { mockSelector } from "./selector";
import { tonePrompt, imagePrompt, headlinePrompt } from "./prompts";

export type ProgressFn = (progress: number, text: string) => void;

const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<EngineLike> | null = null;

// Loose duck-type to avoid pulling WebLLM's full types into our build graph.
// Only the chat.completions.create surface we actually call is modelled.
interface EngineLike {
  chat: {
    completions: {
      create: (req: {
        messages: { role: "user" | "system" | "assistant"; content: string }[];
        max_tokens?: number;
        temperature?: number;
      }) => Promise<{ choices: { message: { content?: string | null } }[] }>;
    };
  };
}

async function getEngine(onProgress?: ProgressFn): Promise<EngineLike> {
  if (enginePromise) return enginePromise;
  const p = (async () => {
    const webllm = await import("@mlc-ai/web-llm");
    const engine = await webllm.CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (r: { progress: number; text: string }) => {
        onProgress?.(r.progress, r.text);
      },
    });
    return engine as unknown as EngineLike;
  })();
  enginePromise = p;
  // If the engine fails to construct, clear the cache so a retry can recover.
  p.catch(() => { enginePromise = null; });
  return p;
}

async function pickLetter(engine: EngineLike, prompt: string): Promise<Choice> {
  const r = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4,
    temperature: 0,
  });
  const out = String(r.choices[0]?.message?.content ?? "").trim();
  const m = out.match(/[A-D]/i);
  return ((m?.[0]?.toUpperCase()) as Choice | undefined) ?? "A";
}

export interface WebLLMSelectorOpts {
  onProgress?: ProgressFn;
  /** If WebGPU is unavailable or the model fails to load, fall back to mock. */
  fallback?: Selector;
}

export function makeWebLLMSelector(opts: WebLLMSelectorOpts = {}): Selector {
  const fallback = opts.fallback ?? mockSelector;
  return {
    async select(input: SelectorInput): Promise<SelectorOutput> {
      try {
        const engine = await getEngine(opts.onProgress);
        const [tone, image, headline] = await Promise.all([
          pickLetter(engine, tonePrompt(input)),
          pickLetter(engine, imagePrompt(input)),
          pickLetter(engine, headlinePrompt(input)),
        ]);
        return { tone_choice: tone, image_choice: image, headline_choice: headline, source: "webllm" };
      } catch (e) {
        // Network/WebGPU/model failure — silently degrade. PRD §11.2.5 fallback path 4.
        if (typeof console !== "undefined") console.warn("[GenUI] WebLLM selector failed, using mock fallback:", e);
        return fallback.select(input);
      }
    },
  };
}

export function isWebGpuAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  return !!(navigator as Navigator & { gpu?: unknown }).gpu;
}
