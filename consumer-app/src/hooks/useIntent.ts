/**
 * useIntent — React Hook for on-device intent detection.
 * 
 * Automatically:
 * - Requests GPS permission
 * - Collects position every 10 seconds
 * - Analyzes intent every 30 seconds
 * - Optionally initializes on-device SLM
 * 
 * Usage:
 *   const { intent, confidence, method, isTracking, slmStatus } = useIntent();
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PositionBuffer,
  analyzeIntent,
  initSLM,
  isSLMReady,
  type IntentResult,
} from "../lib/intentEngine";

interface UseIntentOptions {
  enableSLM?: boolean;        // Try to load on-device SLM (default: true)
  trackingInterval?: number;  // GPS collection interval in ms (default: 10000)
  analysisInterval?: number;  // Intent analysis interval in ms (default: 30000)
  autoStart?: boolean;        // Start tracking immediately (default: true)
}

interface UseIntentReturn {
  intent: IntentResult;
  isTracking: boolean;
  slmStatus: "loading" | "ready" | "unavailable" | "disabled";
  slmProgress: string;
  positionCount: number;
  startTracking: () => void;
  stopTracking: () => void;
}

const DEFAULT_INTENT: IntentResult = {
  type: "browsing_general",
  confidence: 0.3,
  method: "fallback",
};

export function useIntent(options: UseIntentOptions = {}): UseIntentReturn {
  const {
    enableSLM = true,
    trackingInterval = 10000,  // 10 seconds
    analysisInterval = 30000,  // 30 seconds
    autoStart = true,
  } = options;

  const [intent, setIntent] = useState<IntentResult>(DEFAULT_INTENT);
  const [isTracking, setIsTracking] = useState(false);
  const [slmStatus, setSlmStatus] = useState<"loading" | "ready" | "unavailable" | "disabled">(
    enableSLM ? "loading" : "disabled"
  );
  const [slmProgress, setSlmProgress] = useState("");
  const [positionCount, setPositionCount] = useState(0);

  const bufferRef = useRef(new PositionBuffer());
  const trackingRef = useRef<number | null>(null);
  const analysisRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize SLM on mount
  useEffect(() => {
    if (enableSLM) {
      initSLM((progress) => setSlmProgress(progress)).then((success) => {
        setSlmStatus(success ? "ready" : "unavailable");
      });
    }
  }, [enableSLM]);

  // Collect GPS position
  const collectPosition = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        bufferRef.current.add(pos.coords.latitude, pos.coords.longitude);
        setPositionCount(bufferRef.current.length);
      },
      (err) => {
        console.warn("GPS error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Analyze intent from collected positions
  const runAnalysis = useCallback(async () => {
    const positions = bufferRef.current.getPositions();
    if (positions.length < 3) return; // Need at least 3 points

    const result = await analyzeIntent(positions);
    setIntent(result);
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking) return;

    // Initial collection
    collectPosition();

    // Periodic GPS collection (every 10s)
    trackingRef.current = window.setInterval(collectPosition, trackingInterval);

    // Periodic analysis (every 30s)
    analysisRef.current = window.setInterval(runAnalysis, analysisInterval);

    // Also use watchPosition for more accurate tracking
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          bufferRef.current.add(pos.coords.latitude, pos.coords.longitude);
          setPositionCount(bufferRef.current.length);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    setIsTracking(true);
  }, [isTracking, collectPosition, runAnalysis, trackingInterval, analysisInterval]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingRef.current) {
      clearInterval(trackingRef.current);
      trackingRef.current = null;
    }
    if (analysisRef.current) {
      clearInterval(analysisRef.current);
      analysisRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }
    return () => stopTracking();
  }, [autoStart, startTracking, stopTracking]);

  return {
    intent,
    isTracking,
    slmStatus: enableSLM ? (isSLMReady() ? "ready" : slmStatus) : "disabled",
    slmProgress,
    positionCount,
    startTracking,
    stopTracking,
  };
}