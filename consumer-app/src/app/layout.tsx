import type { Metadata } from "next";
import "./globals.css";
import NotificationBanner from "@/components/NotificationBanner";

export const metadata: Metadata = {
  title: "City Wallet",
  description: "Hyper-personalised local offers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationBanner />
        {children}
      </body>
    </html>
  );
}
