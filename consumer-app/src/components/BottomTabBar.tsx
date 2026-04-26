"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SettingsIcon, WalletIcon } from "./Icons";
import type { ReactNode } from "react";

interface Tab {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: ReactNode;
}

const tabs: Tab[] = [
  { href: "/home", label: "Start", match: (p) => p === "/home" || p.startsWith("/offer"), icon: <HomeIcon /> },
  { href: "/wallet", label: "Wallet", match: (p) => p.startsWith("/wallet"), icon: <WalletIcon /> },
  { href: "/settings", label: "Einstellungen", match: (p) => p.startsWith("/settings"), icon: <SettingsIcon /> },
];

export function BottomTabBar() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tabbar__item${active ? " tabbar__item--active" : ""}`}
          >
            {t.icon}
            <span>{t.label}</span>
            {active ? <span className="tabbar__dot" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
