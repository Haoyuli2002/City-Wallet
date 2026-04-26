import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  /** Use the dark variant for full-screen modal-style screens (e.g. U-6 QR). */
  dark?: boolean;
}

export function PhoneFrame({ children, dark = false }: PhoneFrameProps) {
  return (
    <div className="shell">
      <div className="phone">
        <div className={`phone__screen${dark ? " phone__screen--dark" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
