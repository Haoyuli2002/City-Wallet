import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBar, HomeIndicator } from "@/components/StatusBar";
import { AppTopBar } from "@/components/AppTopBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SectionHeader } from "@/components/SectionHeader";
import { BalanceCard } from "@/components/BalanceCard";
import { HistoryRow } from "@/components/HistoryRow";
import { getWallet } from "@/lib/api";

export default async function WalletPage() {
  const wallet = await getWallet();
  return (
    <PhoneFrame>
      <StatusBar />
      <div className="app">
        <AppTopBar context="Wallet" />
        <div className="app__body">
          <BalanceCard balance={wallet.balance} monthLabel={wallet.month_label} />

          <SectionHeader title="Verlauf" more="letzte 30 Tage" />
          {wallet.transactions.length === 0 ? (
            <div className="empty-state">Noch keine Einlösungen.</div>
          ) : (
            wallet.transactions.map((tx) => <HistoryRow key={tx.id} tx={tx} />)
          )}
        </div>
        <BottomTabBar />
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
