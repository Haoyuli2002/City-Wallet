import { formatEuro } from "@/lib/format";

interface BalanceCardProps {
  balance: number;
  monthLabel: string;
}

export function BalanceCard({ balance, monthLabel }: BalanceCardProps) {
  return (
    <div className="balance">
      <span className="balance__corner">{monthLabel}</span>
      <div className="balance__lbl">Dein Cashback</div>
      <div className="balance__num">{formatEuro(balance)}</div>
      <div className="balance__sub">diesen Monat gesammelt</div>
    </div>
  );
}
