import { cn } from "@/lib/utils";
import { Pagination } from "@/ui/pagination";
import { Spinner } from "@/ui/spinner";
import type { UserListItem, UsersPaginationMeta } from "../users.types";
import { UserRecordRow } from "./UserRecordRow";

interface UsersRecordsTableProps {
  items: UserListItem[];
  meta?: UsersPaginationMeta;
  currentPage: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

export function UsersRecordsTable({
  items,
  meta,
  currentPage,
  isFetching = false,
  onPageChange,
}: UsersRecordsTableProps) {
  const page = meta?.page ?? currentPage;
  const totalPages = meta?.totalPages ?? 1;
  const hasUsers = items.length > 0;
  const showEmptyState = !hasUsers && !isFetching;

  return (
    <div className="mt-[25px] w-full">
      <div
        role="table"
        aria-label="User records"
        className="relative w-full overflow-hidden"
      >
        <div
          role="rowgroup"
          className={cn(
            "flex w-full flex-col gap-[17px]",
            !hasUsers && isFetching && "min-h-[543px]",
          )}
        >
          {hasUsers ? (
            items.map((user, index) => (
              <UserRecordRow
                key={user.id}
                user={user}
                isHighlighted={index % 2 === 0}
              />
            ))
          ) : showEmptyState ? (
            <div className="flex h-[53px] items-center justify-center rounded-[8px] bg-background text-[12px] leading-[14px] text-muted-foreground">
              No users found
            </div>
          ) : null}
        </div>

        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-white/70 backdrop-blur-[2px]">
            <Spinner className="h-11 w-11 text-primary" label="Loading users" />
          </div>
        )}
      </div>

      <div className="mt-[29px] flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isDisabled={isFetching || totalPages <= 1}
          ariaLabel="Users pages"
        />
      </div>
    </div>
  );
}
