"use client";

import dynamic from "next/dynamic";
import { AddButton } from "@/ui/add-button";
import { Popup } from "@/ui/popup";
import { Spinner } from "@/ui/spinner";
import { TableSearchInput } from "@/ui/table-search-input";
import { useDebounced } from "@/lib/hooks";
import { type ChangeEvent, useState } from "react";
import {
  useCreateUserMutation,
  useUsersListQuery,
} from "../users.queries";
import { UsersRecordsTable } from "./UsersRecordsTable";

const UserForm = dynamic(
  () => import("./UserForm").then((module) => module.UserForm),
  {
    loading: () => (
      <div className="flex min-h-[260px] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" label="Loading form" />
      </div>
    ),
  },
);

export function UsersRecordsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const createUserMutation = useCreateUserMutation();
  const createUserError =
    createUserMutation.error instanceof Error
      ? createUserMutation.error.message
      : undefined;

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

  const handleCreateOpenChange = (open: boolean) => {
    if (open) {
      createUserMutation.reset();
    }

    setIsCreateOpen(open);
  };

  const handleCreateUser = async (
    payload: Parameters<typeof createUserMutation.mutateAsync>[0],
  ) => {
    try {
      await createUserMutation.mutateAsync(payload);
      setPage(1);
      setIsCreateOpen(false);
    } catch {}
  };

  return (
    <section className="min-h-[815px] w-full rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-heading text-[18px] leading-[22px] font-bold text-card-foreground">
          User Records
        </h2>
        <div className="flex flex-wrap items-center gap-[15px]">
          <TableSearchInput value={search} onChange={handleSearchChange} />
          <Popup
            open={isCreateOpen}
            onOpenChange={handleCreateOpenChange}
            title="Add user"
            description="Create a local email and password account."
            className="max-w-[520px] rounded-[20px]"
            contentClassName="pt-[2px]"
            trigger={<AddButton />}
          >
            <UserForm
              errorMessage={createUserError}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={handleCreateUser}
            />
          </Popup>
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
