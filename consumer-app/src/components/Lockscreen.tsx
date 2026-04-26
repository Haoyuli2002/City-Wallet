"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";

export function Lockscreen() {
  const router = useRouter();

  function unlock() {
    router.push("/home");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      unlock();
    }
  }

  return (
    <PhoneFrame dark>
      <StatusBar light />
      <div
        role="button"
        tabIndex={0}
        aria-label="City Wallet öffnen"
        className="lock"
        onClick={unlock}
        onKeyDown={onKeyDown}
      >
        <div className="lock__skyline" aria-hidden="true" />

        <div className="lock__top">
          <div className="lock__date">Dienstag, 14. Oktober</div>
          <div className="lock__time">14:30</div>
        </div>

        <div className="push-banner">
          <span className="push-banner__app-icon" aria-label="City Wallet">CW</span>
          <div className="push-banner__body">
            <div className="push-banner__head">
              <span className="push-banner__name">City Wallet</span>
              <span className="push-banner__time">jetzt</span>
            </div>
            <h4 className="push-banner__title">
              Draußen kalt? Dein Cappuccino wartet schon.
            </h4>
            <div className="push-banner__meta">
              <div className="push-banner__meta-cell">
                <small>Händler</small>
                <b>Café Müller</b>
              </div>
              <div className="push-banner__meta-cell">
                <small>Distanz</small>
                <b>80 m</b>
              </div>
              <div className="push-banner__meta-cell">
                <small>Rabatt</small>
                <b className="push-banner__meta-cell--accent">−20 %</b>
              </div>
            </div>
          </div>
        </div>

        <div className="lock__bottom">
          <div className="lock__torch-row">
            <span className="lock__torch" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 2l6 0 0 6-3 3-3-3z" />
                <path d="M12 11v11" />
              </svg>
            </span>
            <span className="lock__torch" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="6" width="16" height="12" rx="2" />
                <circle cx="14" cy="12" r="2" />
              </svg>
            </span>
          </div>
          <div className="lock__swipe-hint">Tippen zum Öffnen</div>
        </div>
      </div>
      <HomeIndicator light />
    </PhoneFrame>
  );
}
