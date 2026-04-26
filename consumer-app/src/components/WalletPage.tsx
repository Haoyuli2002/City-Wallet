"use client";

import { useState, useEffect } from "react";
import TabBar from "@/components/TabBar";
import { getWallet } from "@/lib/api";

interface WalletTx {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet("user_demo_001")
      .then(data => {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface-muted)" }}>

      {/* Header */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "14px 20px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>City Wallet</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
          Cashback Wallet
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Balance card */}
        <div style={{
          background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
          border: "1px solid #93c5fd",
          borderRadius: "var(--radius-lg)",
          padding: "24px 20px",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1e40af", marginBottom: 8 }}>
            Available Cashback
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, color: "#1e3a8a", fontVariantNumeric: "tabular-nums" }}>
            {loading ? "—" : `€ ${(balance ?? 0).toFixed(2)}`}
          </div>
          <div style={{ fontSize: 12, color: "#1e40af", marginTop: 8 }}>
            Earned from redeemed offers
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "18px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>
            Transaction History
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-tertiary)", fontSize: 13 }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>No cashback yet</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Accept and redeem offers to earn cashback</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "10px 0",
                  borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                      {tx.description || "Cashback earned"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: tx.type === "cashback" ? "#16a34a" : "#e63946",
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {tx.type === "cashback" ? "+" : "-"}€{tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
            How Cashback Works
          </div>
          {[
            { step: "1", text: "Get an AI offer on the Explore tab" },
            { step: "2", text: "Accept the offer and show the QR code" },
            { step: "3", text: "Merchant scans your code" },
            { step: "4", text: "Discount + cashback credited instantly" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {s.step}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4, paddingTop: 2 }}>{s.text}</div>
            </div>
          ))}
        </div>

      </div>
      <TabBar />
    </div>
  );
}
