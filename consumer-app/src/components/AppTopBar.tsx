import Link from "next/link";
import { BellIcon, MapIcon, UserIcon } from "./Icons";

interface AppTopBarProps {
  /** Wordmark suffix, e.g. "Stuttgart" or "Wallet". */
  context?: string;
}

export function AppTopBar({ context = "Stuttgart" }: AppTopBarProps) {
  return (
    <div className="app__topbar">
      <div className="app__wordmark">
        City Wallet <span>· {context}</span>
      </div>
      <div className="app__icons" aria-hidden="true">
        <button type="button" aria-label="Karte"><MapIcon /></button>
        <button type="button" aria-label="Mitteilungen"><BellIcon /></button>
        <Link href="/settings" aria-label="Profil"><UserIcon /></Link>
      </div>
    </div>
  );
}
