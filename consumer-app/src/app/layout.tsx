import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Wallet",
  description: "Hyper-personalised local offers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
