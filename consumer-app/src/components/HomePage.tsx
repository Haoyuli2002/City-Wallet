// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import TabBar from "@/components/TabBar";
import OfferCard from "@/components/OfferCard";
import { getMerchants, generateOffer, acceptOffer, dismissOffer, MAPS_KEY, type Merchant, type OfferResponse } from "@/lib/api";
import { getSavedCity, saveCity, addActiveOffer } from "@/lib/store";

const CITY_CENTERS: Record<string, { lat: number; lon: number; label: string }> = {
  munich:    { lat: 48.1371, lon: 11.5754, label: "Munich" },
  stuttgart: { lat: 48.7758, lon:  9.1829, label: "Stuttgart" },
};

const CAT_ICONS: Record<string, string> = {
  cafe: "☕", restaurant: "🍽️", bakery: "🥖", bar: "🍺", book_store: "📚",
};

declare global { interface Window { initConsumerMap?: () => void; google?: typeof google; } }

export default function HomePage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [city, setCity] = useState<string>(getSavedCity());
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set(["all"]));
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [offer, setOffer] = useState<OfferResponse | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const cityCenter = CITY_CENTERS[city] ?? CITY_CENTERS.munich;

  // Load merchants when city changes
  useEffect(() => {
    getMerchants(city)
      .then(setMerchants)
      .catch(console.error);
  }, [city]);

  // Init Google Maps
  useEffect(() => {
    if (mapLoaded || !mapRef.current) return;
    if (window.google?.maps) { initMap(); return; }

    // Prevent loading Maps script multiple times
    const existing = document.querySelector('script[src*="maps.googleapis"]');
    if (existing) {
      // Script already in DOM - just wait for google to be ready
      const poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); initMap(); }
      }, 100);
      return () => clearInterval(poll);
    }
    window.initConsumerMap = () => { initMap(); };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initConsumerMap`;
    script.async = true;
    document.head.appendChild(script);
    return () => { delete window.initConsumerMap; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initMap() {
    if (!mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: cityCenter.lat, lng: cityCenter.lon },
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    mapInstance.current = map;
    setMapLoaded(true);
  }

  // Update markers when merchants or map changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || merchants.length === 0) return;

    // Clear old markers
    markersRef.current.forEach(mk => mk.setMap(null));
    markersRef.current = [];

    // Re-center map
    mapInstance.current.setCenter({ lat: cityCenter.lat, lng: cityCenter.lon });

    const filteredM = categoryFilters.has("all") ? merchants : merchants.filter(m => categoryFilters.has(m.category));
    filteredM.forEach(m => {
      const lat = parseFloat(String(m.lat));
      const lng = parseFloat(String(m.lon));
      if (isNaN(lat) || isNaN(lng)) return; // skip invalid coords

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current!,
        title: m.name,
        label: { text: CAT_ICONS[m.category] || "🏪", fontSize: "18px" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#0a0a0a",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 14,
        },
      });

      marker.addListener("click", () => {
        // Toggle: click same merchant again to close panel
        setSelectedMerchant(prev => (prev?.id === m.id ? null : m));
        setOffer(null);
      });

      markersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchants, mapLoaded, city, categoryFilters]);

  const handleGenerateOffer = useCallback(async (merchant: Merchant) => {
    setOfferLoading(true);
    try {
      const o = await generateOffer({
        lat: cityCenter.lat,
        lon: cityCenter.lon,
        merchant_id: merchant.id,
        user_intent: "browsing_general",
      });
      setOffer(o);
    } catch (e) {
      console.error(e);
    } finally {
      setOfferLoading(false);
    }
  }, [cityCenter]);

  const handleAccept = useCallback(async () => {
    if (!offer) return;
    try {
      const accepted = await acceptOffer(offer.id);
      addActiveOffer(accepted.id);
      router.push("/checkout");
    } catch (e) {
      console.error(e);
    }
  }, [offer, router]);

  const handleDismiss = useCallback(async () => {
    if (!offer) return;
    await dismissOffer(offer.id).catch(console.error);
    setOffer(null);
    setSelectedMerchant(null);
  }, [offer]);

  const switchCity = (newCity: string) => {
    saveCity(newCity);
    setCity(newCity);
    setOffer(null);
    setSelectedMerchant(null);
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", position: "relative", background: "#e5e7eb" }}>

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
          City Wallet
        </div>
        {/* City switcher */}
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(CITY_CENTERS).map(([id, info]) => (
            <button
              key={id}
              onClick={() => switchCity(id)}
              style={{
                padding: "6px 12px",
                border: "1px solid",
                borderColor: city === id ? "var(--ink)" : "var(--border-default)",
                background: city === id ? "var(--ink)" : "var(--surface)",
                color: city === id ? "#fff" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12, fontWeight: city === id ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0, zIndex: 29,
        padding: "8px 12px",
        display: "flex", gap: 6, overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {[
          { id: "all",       label: "All" },
          { id: "cafe",      label: "☕ Café" },
          { id: "restaurant",label: "🍽️ Restaurant" },
          { id: "bakery",    label: "🥖 Bakery" },
          { id: "bar",       label: "🍺 Bar" },
          { id: "book_store",label: "📚 Books" },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setCategoryFilters(prev => {
                const next = new Set(prev);
                if (cat.id === "all") {
                  return new Set(["all"]);
                }
                next.delete("all");
                if (next.has(cat.id)) {
                  next.delete(cat.id);
                  if (next.size === 0) return new Set(["all"]);
                } else {
                  next.add(cat.id);
                }
                return next;
              });
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid",
              borderColor: categoryFilters.has(cat.id) ? "var(--ink)" : "rgba(0,0,0,0.15)",
              background: categoryFilters.has(cat.id) ? "var(--ink)" : "rgba(255,255,255,0.92)",
              color: categoryFilters.has(cat.id) ? "#fff" : "var(--text-primary)",
              borderRadius: 20,
              fontSize: 12, fontWeight: categoryFilters.has(cat.id) ? 600 : 400,
              cursor: "pointer", whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", minHeight: "100dvh" }} />

      {/* Merchant info panel (slides up when merchant selected) */}
      {selectedMerchant && !offer && (
        <div style={{
          position: "absolute", bottom: 68, left: 0, right: 0, zIndex: 20,
          background: "var(--surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          padding: "20px 20px 16px",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          animation: "slideUp 0.3s ease",
        }}>
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, background: "var(--border-default)", borderRadius: 2, margin: "0 auto 16px" }} />

          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 36 }}>{CAT_ICONS[selectedMerchant.category] || "🏪"}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{selectedMerchant.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                {selectedMerchant.category} · ★{selectedMerchant.rating}
              </div>
              {selectedMerchant.address && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{selectedMerchant.address}</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleGenerateOffer(selectedMerchant)}
              disabled={offerLoading}
              style={{
                flex: 1, padding: "13px",
                background: offerLoading ? "var(--border-default)" : "var(--ink)",
                color: offerLoading ? "var(--text-tertiary)" : "#fff",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: 14, fontWeight: 600,
                cursor: offerLoading ? "not-allowed" : "pointer",
              }}
            >
              {offerLoading ? "Generating offer…" : "✨ Get AI Offer"}
            </button>
            <button
              onClick={() => { setSelectedMerchant(null); setOffer(null); }}
              style={{
                padding: "13px 16px",
                background: "var(--surface-muted)", color: "var(--text-secondary)",
                border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                fontSize: 14, cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Offer card (slides up over merchant panel) */}
      {offer && (
        <div style={{
          position: "absolute", bottom: 68, left: 0, right: 0, zIndex: 25,
          padding: "0 12px",
          animation: "slideUp 0.35s ease",
        }}>
          <OfferCard
            offer={offer}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      <TabBar />
    </div>
  );
}
