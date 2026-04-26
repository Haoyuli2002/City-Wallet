import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Wallet — Merchant",
  description: "Merchant dashboard for City Wallet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
