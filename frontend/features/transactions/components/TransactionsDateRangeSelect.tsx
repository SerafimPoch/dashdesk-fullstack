"use client";

import { format, isSameMonth, isSameYear, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { TransactionDateRangeOption } from "../transactions.types";

interface TransactionsDateRangeSelectProps {
  className?: string;
  isDisabled?: boolean;
  options: TransactionDateRangeOption[];
  value: string;
  onValueChange: (value: string) => void;
}

function formatTransactionsDateRange({
  from,
  to,
}: Pick<TransactionDateRangeOption, "from" | "to">) {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  if (isSameMonth(fromDate, toDate) && isSameYear(fromDate, toDate)) {
    return format(fromDate, "MMMM yyyy");
  }

  if (isSameYear(fromDate, toDate)) {
    return `${format(fromDate, "MMMM")} - ${format(toDate, "MMMM yyyy")}`;
  }

  return `${format(fromDate, "MMMM yyyy")} - ${format(toDate, "MMMM yyyy")}`;
}

export function TransactionsDateRangeSelect({
  className,
  isDisabled = false,
  options,
  value,
  onValueChange,
}: TransactionsDateRangeSelectProps) {
  const selectedOption = options.find((option) => option.value === value);
  const label = selectedOption
    ? formatTransactionsDateRange(selectedOption)
    : "Select period";

  return (
    <label
      className={cn(
        "relative inline-flex w-fit items-center gap-[10px] font-heading text-[16px] leading-[20px] font-bold text-card-foreground",
        className,
      )}
    >
      <span className="pr-[2px]">{label}</span>
      <select
        aria-label="Transactions period"
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={isDisabled || options.length === 0}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {!selectedOption ? <option value="">Select period</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {formatTransactionsDateRange(option)}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="mt-[-3px] size-[8px] rotate-45 border-r-2 border-b-2 border-card-foreground"
      />
    </label>
  );
}
