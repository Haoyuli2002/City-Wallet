/**
 * Intent Engine — On-device user behavior analysis
 * 
 * Analyzes GPS trajectory to infer user intent.
 * Runs entirely on the user's device — raw GPS never leaves the phone.
 * Only the abstract intent result is sent to the backend (GDPR compliant).
 * 
 * Three-level fallback:
 *   Level 1: WebGPU + Qwen2.5-0.5B (SLM choice mode) — best accuracy
 *   Level 2: transformers.js + WASM — slower but compatible
 *   Level 3: Rule-based heuristics — always works, no model needed
 */

// ==================== Types ====================

export interface Position {
  lat: number;
  lon: number;
  timestamp: number; // Unix ms
}

export interface MovementSummary {
  avgSpeedKmh: number;
  stops: number;          // Number of stops (speed < 0.5 km/h for > 30s)
  directionChanges: number; // Number of significant direction changes (> 30°)
  totalDistanceM: number;
  durationMinutes: number;
  currentHour: number;
}

export interface IntentResult {
  type: "commuting" | "stationary" | "browsing_food" | "browsing_general";
  confidence: number; // 0-1
  method: "rule" | "slm" | "fallback"; // How was this determined
}

// ==================== Math Helpers ====================

/**
 * Haversine distance between two GPS points in meters.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing (direction) between two points in degrees (0-360).
 */
function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dlambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dlambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ==================== Movement Analysis ====================

/**
 * Compute movement summary from GPS positions.
 * Pure math — no AI, no network calls.
 */
export function computeMovementSummary(positions: Position[]): MovementSummary {
  if (positions.length < 2) {
    return {
      avgSpeedKmh: 0,
      stops: 0,
      directionChanges: 0,
      totalDistanceM: 0,
      durationMinutes: 0,
      currentHour: new Date().getHours(),
    };
  }

  let totalDistance = 0;
  let stops = 0;
  let directionChanges = 0;
  let stopDuration = 0;
  let prevBearing = -1;

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];

    // Distance
    const dist = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    totalDistance += dist;

    // Time diff in hours
    const timeDiffH = (curr.timestamp - prev.timestamp) / 3600000;
    const segmentSpeed = timeDiffH > 0 ? dist / 1000 / timeDiffH : 0; // km/h

    // Stop detection: speed < 0.5 km/h
    if (segmentSpeed < 0.5) {
      stopDuration += (curr.timestamp - prev.timestamp) / 1000; // seconds
      if (stopDuration >= 30) {
        stops++;
        stopDuration = 0; // Reset after counting a stop
      }
    } else {
      stopDuration = 0;
    }

    // Direction change detection
    if (dist > 5) {
      // Only count if moved more than 5m (avoid GPS jitter)
      const currBearing = bearing(prev.lat, prev.lon, curr.lat, curr.lon);
      if (prevBearing >= 0) {
        let angleDiff = Math.abs(currBearing - prevBearing);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        if (angleDiff > 30) {
          directionChanges++;
        }
      }
      prevBearing = currBearing;
    }
  }

  const durationMs = positions[positions.length - 1].timestamp - positions[0].timestamp;
  const durationH = durationMs / 3600000;
  const durationMin = durationMs / 60000;
  const avgSpeed = durationH > 0 ? totalDistance / 1000 / durationH : 0;

  return {
    avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
    stops,
    directionChanges,
    totalDistanceM: Math.round(totalDistance),
    durationMinutes: Math.round(durationMin * 10) / 10,
    currentHour: new Date().getHours(),
  };
}

// ==================== Intent Classification ====================

/**
 * Rule-based intent classification (Level 3 — always available).
 */
export function classifyByRules(summary: MovementSummary): IntentResult {
  const { avgSpeedKmh, stops, directionChanges, currentHour } = summary;

  // Clear commuting: fast + straight
  if (avgSpeedKmh > 4 && directionChanges <= 2) {
    return { type: "commuting", confidence: 0.9, method: "rule" };
  }

  // Clear stationary: barely moving
  if (avgSpeedKmh < 0.3) {
    return { type: "stationary", confidence: 0.85, method: "rule" };
  }

  // Running/jogging (fast but not straight — could be exercising)
  if (avgSpeedKmh > 5) {
    return { type: "commuting", confidence: 0.8, method: "rule" };
  }

  // Browsing for food: slow + stops + meal time
  const isMealTime =
    (currentHour >= 11 && currentHour <= 14) || // Lunch
    (currentHour >= 17 && currentHour <= 21);    // Dinner
  
  if (avgSpeedKmh >= 0.5 && avgSpeedKmh <= 3 && stops >= 2 && isMealTime) {
    return { type: "browsing_food", confidence: 0.8, method: "rule" };
  }

  // General browsing: slow + zigzag
  if (avgSpeedKmh >= 0.5 && avgSpeedKmh <= 3 && directionChanges >= 3) {
    return { type: "browsing_general", confidence: 0.65, method: "rule" };
  }

  // Slow with some stops but not meal time
  if (avgSpeedKmh >= 0.5 && avgSpeedKmh <= 3 && stops >= 1) {
    return { type: "browsing_general", confidence: 0.55, method: "rule" };
  }

  // Default: ambiguous slow movement
  if (avgSpeedKmh <= 3) {
    return { type: "browsing_general", confidence: 0.4, method: "rule" };
  }

  // Default: moderate speed, uncertain
  return { type: "commuting", confidence: 0.5, method: "rule" };
}

// ==================== SLM Integration (WebLLM) ====================

// Model configuration
const SLM_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const SLM_MAX_TOKENS = 5; // Only need "C 0.85" — very few tokens

// Lazy-loaded engine instance
let slmEngine: any = null;
let slmLoading = false;
let slmAvailable: boolean | null = null; // null = unknown, true/false = tested

/**
 * Initialize the on-device SLM via WebLLM.
 * Uses WebGPU for acceleration. Cached in IndexedDB after first download.
 * Call this once on app startup.
 */
export async function initSLM(onProgress?: (progress: string) => void): Promise<boolean> {
  if (slmEngine) return true;
  if (slmLoading) return false;
  
  slmLoading = true;
  
  try {
    // Dynamic import — WebLLM is only loaded if needed
    const webllm = await import("@mlc-ai/web-llm");
    
    // Check WebGPU support
    if (!navigator.gpu) {
      console.warn("⚠️ WebGPU not supported. SLM disabled, using rule-based fallback.");
      slmAvailable = false;
      slmLoading = false;
      return false;
    }

    // Create engine with progress callback
    const engine = await webllm.CreateMLCEngine(SLM_MODEL, {
      initProgressCallback: (report: any) => {
        const msg = `Loading SLM: ${report.text}`;
        console.log(msg);
        onProgress?.(msg);
      },
    });

    slmEngine = engine;
    slmAvailable = true;
    slmLoading = false;
    console.log("✅ On-device SLM loaded successfully!");
    return true;

  } catch (error) {
    console.warn("⚠️ SLM initialization failed:", error);
    slmAvailable = false;
    slmLoading = false;
    return false;
  }
}

/**
 * SLM-based intent classification using choice mode.
 * The model picks from 4 options — outputs only 1-2 tokens.
 * Returns null if SLM is not available (triggers rule fallback).
 */
export async function classifyBySLM(summary: MovementSummary): Promise<IntentResult | null> {
  // Skip if SLM is known to be unavailable
  if (slmAvailable === false || !slmEngine) {
    return null;
  }

  const prompt = `Classify user intent from movement data.
Speed: ${summary.avgSpeedKmh} km/h, Stops: ${summary.stops}, Dir changes: ${summary.directionChanges}, Hour: ${summary.currentHour}
A) commuting B) stationary C) browsing_food D) browsing_general
Answer:`;

  try {
    const response = await slmEngine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      max_tokens: SLM_MAX_TOKENS,
      temperature: 0.1, // Very low — we want deterministic classification
    });

    const output = response.choices[0]?.message?.content?.trim() || "";
    return parseSLMResponse(output);

  } catch (error) {
    console.warn("⚠️ SLM inference failed:", error);
    return null; // Triggers rule fallback
  }
}

/**
 * Parse SLM output. Expects format like "C" or "C 0.85" or "browsing_food".
 */
function parseSLMResponse(output: string): IntentResult | null {
  const cleaned = output.toUpperCase().trim();
  
  const intentMap: Record<string, IntentResult["type"]> = {
    "A": "commuting",
    "B": "stationary",
    "C": "browsing_food",
    "D": "browsing_general",
  };

  // Try to match letter + optional confidence
  const letterMatch = cleaned.match(/^([A-D])\s*([\d.]*)/);
  if (letterMatch) {
    const letter = letterMatch[1];
    const conf = letterMatch[2] ? parseFloat(letterMatch[2]) : 0.75;
    const type = intentMap[letter];
    if (type) {
      return { 
        type, 
        confidence: Math.min(Math.max(conf, 0.1), 1.0), 
        method: "slm" 
      };
    }
  }

  // Try to match intent name directly
  const lowerOutput = output.toLowerCase();
  for (const [, intentType] of Object.entries(intentMap)) {
    if (lowerOutput.includes(intentType)) {
      return { type: intentType, confidence: 0.7, method: "slm" };
    }
  }

  return null; // Unparseable — fall back to rules
}

/**
 * Check if SLM is loaded and ready.
 */
export function isSLMReady(): boolean {
  return slmAvailable === true && slmEngine !== null;
}

// ==================== Main Intent Engine ====================

/**
 * Main intent analysis function.
 * Tries SLM first, falls back to rules.
 */
export async function analyzeIntent(positions: Position[]): Promise<IntentResult> {
  // Step 1: Compute movement summary (pure math)
  const summary = computeMovementSummary(positions);

  // Step 2: Clear cases — use rules directly (save battery)
  if (summary.avgSpeedKmh > 4 || summary.avgSpeedKmh < 0.3) {
    return classifyByRules(summary);
  }

  // Step 3: Ambiguous cases — try SLM
  const slmResult = await classifyBySLM(summary);
  if (slmResult) {
    return slmResult;
  }

  // Step 4: Fallback to rules
  return classifyByRules(summary);
}

// ==================== Position Buffer ====================

/**
 * Manages GPS position collection with a rolling 10-minute buffer.
 */
export class PositionBuffer {
  private positions: Position[] = [];
  private maxAge = 10 * 60 * 1000; // 10 minutes in ms

  add(lat: number, lon: number): void {
    const now = Date.now();
    this.positions.push({ lat, lon, timestamp: now });
    // Remove positions older than 10 minutes
    this.positions = this.positions.filter((p) => now - p.timestamp < this.maxAge);
  }

  getPositions(): Position[] {
    return [...this.positions];
  }

  get length(): number {
    return this.positions.length;
  }

  clear(): void {
    this.positions = [];
  }
}