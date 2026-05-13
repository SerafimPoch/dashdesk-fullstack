"use client";

import { Button } from "@/ui/button";
import { FilterIcon, PlusIcon } from "@/ui/icons";
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
          <Button
            type="button"
            variant="outline"
            className="h-[30px] w-[84px] cursor-pointer gap-[5px] rounded-[10px] border-[#B0B0B0] bg-card px-0 font-heading text-[14px] leading-[17px] font-bold text-muted-foreground hover:bg-card hover:text-muted-foreground"
          >
            <FilterIcon className="h-[14px] w-[18px]" size={18} />
            Filter
          </Button>
          <Button
            type="button"
            className="h-[30px] w-[80px] cursor-pointer gap-[5px] rounded-[10px] bg-primary px-0 font-heading text-[14px] leading-[17px] font-bold text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon className="h-5 w-5" size={20} />
            Add
          </Button>
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
