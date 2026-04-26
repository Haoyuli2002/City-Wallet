import { CheckIcon } from "./Icons";
import { formatEuro, formatHistoryDate } from "@/lib/format";
import type { WalletTransaction } from "@/lib/types";

export function HistoryRow({ tx }: { tx: WalletTransaction }) {
  return (
    <div className="history-row">
      <span className="history-row__icon"><CheckIcon /></span>
      <div className="history-row__txt">
        <span className="history-row__name">{tx.merchant_name}</span>
        <span className="history-row__date">{formatHistoryDate(tx.created_at)}</span>
      </div>
      <span className="history-row__amt">{formatEuro(tx.amount, { sign: true })}</span>
    </div>
  );
}
