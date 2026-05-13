"use client";

import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  isDisabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const paginationButtonClass =
  "size-[26px] rounded-[8px] border-border bg-card p-0 font-heading text-[12px] leading-none text-muted-foreground hover:bg-background hover:text-muted-foreground";

const paginationArrowClass =
  "size-[26px] rounded-[8px] border-border bg-card p-0 text-muted-foreground hover:bg-background hover:text-muted-foreground";

function PaginationArrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[14px]", direction === "next" && "rotate-180")}
      viewBox="0 0 14 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 2.5L3 11L11.5 19.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  isDisabled = false,
  className,
  ariaLabel = "Pagination",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(page, 1), safeTotalPages);
  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1);

  const canGoPrevious = currentPage > 1 && !isDisabled;
  const canGoNext = currentPage < safeTotalPages && !isDisabled;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("flex items-center gap-[7px]", className)}
    >
      <Button
        type="button"
        variant="outline"
        className={paginationArrowClass}
        aria-label="Previous page"
        disabled={!canGoPrevious}
        onClick={() => onPageChange?.(currentPage - 1)}
      >
        <PaginationArrow direction="previous" />
      </Button>

      {pages.map((pageNumber) => {
        const isActive = pageNumber === currentPage;

        return (
          <Button
            key={pageNumber}
            type="button"
            variant="outline"
            className={cn(
              paginationButtonClass,
              isActive && "bg-input text-muted-foreground hover:bg-input",
            )}
            aria-current={isActive ? "page" : undefined}
            disabled={isDisabled}
            onClick={() => onPageChange?.(pageNumber)}
          >
            {pageNumber}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className={paginationArrowClass}
        aria-label="Next page"
        disabled={!canGoNext}
        onClick={() => onPageChange?.(currentPage + 1)}
      >
        <PaginationArrow direction="next" />
      </Button>
    </nav>
  );
}
