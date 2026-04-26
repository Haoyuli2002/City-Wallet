"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "./Icons";

interface SettingRowProps {
  icon: ReactNode;
  title: string;
  sub?: string;
  value?: boolean;
  onToggle?: () => void;
  hasToggle?: boolean;
  href?: string;
}

export function SettingRow({ icon, title, sub, value, onToggle, hasToggle = true, href }: SettingRowProps) {
  const body = (
    <>
      <div className="setting-row__icon">{icon}</div>
      <div className="setting-row__body">
        <div className="setting-row__h">{title}</div>
        {sub ? <div className="setting-row__s">{sub}</div> : null}
      </div>
      {hasToggle ? (
        <button
          type="button"
          aria-pressed={!!value}
          className={`toggle${value ? "" : " toggle--off"}`}
          onClick={onToggle}
        />
      ) : (
        <span style={{ color: "var(--text-tertiary)" }} aria-hidden="true"><ChevronIcon /></span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="setting-row setting-row--link">
        {body}
      </Link>
    );
  }

  return <div className="setting-row">{body}</div>;
}
