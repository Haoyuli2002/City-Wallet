"use client";
import dynamic from "next/dynamic";

const CheckoutClient = dynamic(() => import("@/components/CheckoutPage"), {
  ssr: false,
  loading: () => <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></div>,
});

export default function Page() {
  return <CheckoutClient />;
}
