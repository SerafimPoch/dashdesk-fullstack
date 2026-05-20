"use client";

import { AddButton } from "@/ui/add-button";
import { FilterButton } from "@/ui/filter-button";
import { TableSearchInput } from "@/ui/table-search-input";
import { useDebounced } from "@/lib/hooks";
import { type ChangeEvent, useState } from "react";
import { useUsersListQuery } from "../users.queries";
import { UsersRecordsTable } from "./UsersRecordsTable";

export function UsersRecordsPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const searchValue = useDebounced({
    searchQuery: search,
    delay: 400,
  });

  const { data, isFetching } = useUsersListQuery({
    page,
    limit: 10,
    search: searchValue,
  });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  return (
    <section className="min-h-[815px] w-full rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-heading text-[18px] leading-[22px] font-bold text-card-foreground">
          User Records
        </h2>
        <div className="flex flex-wrap items-center gap-[15px]">
          <TableSearchInput value={search} onChange={handleSearchChange} />
          <FilterButton />
          <AddButton />
        </div>
      </div>
      <UsersRecordsTable
        items={data?.items ?? []}
        meta={data?.meta}
        currentPage={page}
        isFetching={isFetching}
        onPageChange={setPage}
      />
    </section>
  );
}
