import { Pagination } from "@/ui/pagination";
import { Spinner } from "@/ui/spinner";
import type {
  TransactionListItem,
  TransactionsPaginationMeta,
} from "../transactions.types";
import {
  TransactionRecordRow,
  transactionGridClass,
} from "./TransactionRecordRow";

const transactionColumns = ["Name", "Email", "Product", "Qty", "Total"];

interface TransactionsRecordsTableProps {
  items: TransactionListItem[];
  meta?: TransactionsPaginationMeta;
  currentPage: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

export function TransactionsRecordsTable({
  items,
  meta,
  currentPage,
  isFetching = false,
  onPageChange,
}: TransactionsRecordsTableProps) {
  const page = meta?.page ?? currentPage;
  const totalPages = meta?.totalPages ?? 1;
  const hasTransactions = items.length > 0;
  const showEmptyState = !hasTransactions && !isFetching;

  return (
    <div className="mt-[28px] w-full">
      <div className="relative overflow-x-auto pb-1">
        <div
          role="table"
          aria-label="Transactions"
          className="min-w-[760px]"
        >
          <div
            role="row"
            className={`${transactionGridClass} h-[40px] rounded-[8px] bg-[#717171] px-[18px] font-heading text-[12px] leading-[15px] font-bold text-white`}
          >
            {transactionColumns.map((column) => (
              <div key={column} role="columnheader" className="truncate pr-4">
                {column}
              </div>
            ))}
          </div>

          <div role="rowgroup" className="mt-[10px] flex flex-col gap-[10px]">
            {hasTransactions ? (
              items.map((transaction, index) => (
                <TransactionRecordRow
                  key={transaction.id}
                  transaction={transaction}
                  isHighlighted={index % 2 === 0}
                />
              ))
            ) : showEmptyState ? (
              <div className="flex h-[40px] items-center justify-center rounded-[8px] bg-background text-[12px] leading-[15px] text-muted-foreground">
                No transactions found
              </div>
            ) : null}
          </div>
        </div>

        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-white/70 backdrop-blur-[2px]">
            <Spinner
              className="h-11 w-11 text-primary"
              label="Loading transactions"
            />
          </div>
        )}
      </div>

      <div className="mt-[32px] flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isDisabled={isFetching || totalPages <= 1}
          ariaLabel="Transactions pages"
        />
      </div>
    </div>
  );
}
