"use client";

import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { AppTopBar } from "@/components/AppTopBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SectionHeader } from "@/components/SectionHeader";
import { SettingRow } from "@/components/SettingRow";
import {
  BellIcon,
  GlobeIcon,
  LockIcon,
  PinIcon,
  ReceiptIcon,
  SparkleIcon,
  UserIcon,
} from "@/components/Icons";

export default function SettingsPage() {
  const [push, setPush] = useState(true);
  const [location, setLocation] = useState(true);
  const [onDevice, setOnDevice] = useState(true);
  const [history, setHistory] = useState(false);

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <AppTopBar context="Einstellungen" />
        <div className="app__body">
          <div className="profile-head">
            <div className="profile-head__avatar">MS</div>
            <div>
              <div className="profile-head__name">Mia Schmidt</div>
              <div className="profile-head__iban">DE89 6005 0101 1234 5678 90</div>
            </div>
          </div>

          <SectionHeader title="Mitteilungen" />
          <SettingRow
            icon={<BellIcon />}
            title="Push-Mitteilungen"
            sub="Bei passenden Angeboten"
            value={push}
            onToggle={() => setPush((v) => !v)}
          />
          <SettingRow
            icon={<PinIcon />}
            title="Standort"
            sub="Nur im Vordergrund"
            value={location}
            onToggle={() => setLocation((v) => !v)}
          />

          <SectionHeader title="Datenschutz" />
          <SettingRow
            icon={<LockIcon />}
            title="Verarbeitung auf Gerät"
            sub="Empfohlen"
            value={onDevice}
            onToggle={() => setOnDevice((v) => !v)}
          />
          <SettingRow
            icon={<GlobeIcon />}
            title="Anonymisierten Verlauf teilen"
            sub="Hilft, Angebote zu verbessern"
            value={history}
            onToggle={() => setHistory((v) => !v)}
          />
          <SettingRow
            icon={<SparkleIcon />}
            title="KI-Transparenz"
            sub="EU AI Act · Was die KI weiß"
            hasToggle={false}
            href="/transparency"
          />

          <SectionHeader title="Über" />
          <SettingRow icon={<UserIcon />} title="Sprache" sub="Deutsch" hasToggle={false} />
          <SettingRow icon={<ReceiptIcon />} title="Nutzungsbedingungen" hasToggle={false} />
        </div>
        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
