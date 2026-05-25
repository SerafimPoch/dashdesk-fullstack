"use client";

import dynamic from "next/dynamic";
import { type ChangeEvent, useState } from "react";
import { useDebounced } from "@/lib/hooks";
import { AddButton } from "@/ui/add-button";
import { FilterButton } from "@/ui/filter-button";
import { Popup } from "@/ui/popup";
import { Spinner } from "@/ui/spinner";
import { TableSearchInput } from "@/ui/table-search-input";
import {
  useCreateTransactionMutation,
  useTransactionDateRangesQuery,
  useTransactionsListQuery,
} from "../transactions.queries";
import type { TransactionFilters } from "../transactions.types";
import { TransactionsDateRangeSelect } from "./TransactionsDateRangeSelect";
import { TransactionsRecordsTable } from "./TransactionsRecordsTable";

const TransactionForm = dynamic(
  () => import("./TransactionForm").then((module) => module.TransactionForm),
  {
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" label="Loading form" />
      </div>
    ),
  },
);

const TransactionsFilterForm = dynamic(
  () =>
    import("./TransactionsFilterForm").then(
      (module) => module.TransactionsFilterForm,
    ),
  {
    loading: () => (
      <div className="flex min-h-[220px] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" label="Loading filters" />
      </div>
    ),
  },
);

export function TransactionsPageContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [page, setPage] = useState(1);
  const { data: dateRangesData, isFetching: isFetchingDateRanges } =
    useTransactionDateRangesQuery();
  const createTransactionMutation = useCreateTransactionMutation();
  const createTransactionError =
    createTransactionMutation.error instanceof Error
      ? createTransactionMutation.error.message
      : undefined;

  const dateRangeOptions = dateRangesData?.items ?? [];
  const selectedDateRangeOption =
    dateRangeOptions.find((option) => option.value === selectedDateRange) ??
    dateRangeOptions[0] ??
    null;
  const selectedDateRangeValue = selectedDateRangeOption?.value ?? "";
  const hasActiveFilters = Object.keys(filters).length > 0;

  const searchValue = useDebounced({
    searchQuery: search,
    delay: 400,
  });

  const { data, isFetching } = useTransactionsListQuery({
    page,
    limit: 11,
    search: searchValue,
    from: selectedDateRangeOption?.from,
    to: selectedDateRangeOption?.to,
    ...filters,
  });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    setPage(1);
  };

  const handleCreateOpenChange = (open: boolean) => {
    if (open) {
      createTransactionMutation.reset();
    }

    setIsCreateOpen(open);
  };

  const handleCreateTransaction = async (
    payload: Parameters<typeof createTransactionMutation.mutateAsync>[0],
  ) => {
    try {
      await createTransactionMutation.mutateAsync(payload);
      setPage(1);
      setIsCreateOpen(false);
    } catch {
      // The mutation error is rendered in the open form.
    }
  };

  return (
    <section className="min-h-[660px] w-full rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <TransactionsDateRangeSelect
          isDisabled={isFetchingDateRanges}
          options={dateRangeOptions}
          value={selectedDateRangeValue}
          onValueChange={handleDateRangeChange}
        />

        <div className="flex flex-wrap items-center gap-[15px]">
          <TableSearchInput value={search} onChange={handleSearchChange} />
          <Popup
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            title="Filter transactions"
            description="Narrow results by product, quantity, or total."
            className="max-w-[520px] rounded-[20px]"
            contentClassName="pt-[2px]"
            trigger={
              <FilterButton
                className={
                  hasActiveFilters
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                    : undefined
                }
              />
            }
          >
            <TransactionsFilterForm
              defaultFilters={filters}
              onApply={(nextFilters) => {
                setFilters(nextFilters);
                setPage(1);
                setIsFilterOpen(false);
              }}
              onClear={() => {
                setFilters({});
                setPage(1);
                setIsFilterOpen(false);
              }}
            />
          </Popup>
          <Popup
            open={isCreateOpen}
            onOpenChange={handleCreateOpenChange}
            title="Add transaction"
            description="Enter the transaction details and sale date."
            className="max-w-[560px] rounded-[20px]"
            contentClassName="pt-[2px]"
            trigger={<AddButton />}
          >
            <TransactionForm
              errorMessage={createTransactionError}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={handleCreateTransaction}
            />
          </Popup>
        </div>
      </div>

      <TransactionsRecordsTable
        items={data?.items ?? []}
        meta={data?.meta}
        currentPage={page}
        isFetching={isFetching}
        onPageChange={setPage}
      />
    </section>
  );
}
