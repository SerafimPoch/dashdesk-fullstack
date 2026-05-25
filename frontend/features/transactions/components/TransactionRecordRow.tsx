import { cn } from "@/lib/utils";
import type { TransactionListItem } from "../transactions.types";

interface TransactionRecordRowProps {
  transaction: TransactionListItem;
  isHighlighted?: boolean;
}

const transactionGridClass =
  "grid min-w-[760px] grid-cols-[minmax(130px,1.25fr)_minmax(190px,1.6fr)_minmax(145px,1.15fr)_minmax(90px,0.7fr)_minmax(100px,0.8fr)] items-center";

export function TransactionRecordRow({
  transaction,
  isHighlighted = false,
}: TransactionRecordRowProps) {
  return (
    <div
      role="row"
      className={cn(
        transactionGridClass,
        "h-[40px] rounded-[8px] px-[18px] text-[12px] leading-[15px] text-foreground",
        isHighlighted ? "bg-input" : "bg-background",
      )}
    >
      <div role="cell" className="truncate pr-4">
        {transaction.name}
      </div>
      <div role="cell" className="truncate pr-4">
        {transaction.email}
      </div>
      <div role="cell" className="truncate pr-4">
        {transaction.product}
      </div>
      <div role="cell" className="truncate pr-4">
        {transaction.quantity}
      </div>
      <div role="cell" className="truncate">
        {transaction.total}
      </div>
    </div>
  );
}

export { transactionGridClass };
