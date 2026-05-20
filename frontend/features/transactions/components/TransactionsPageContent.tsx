import { AddButton } from "@/ui/add-button";
import { FilterButton } from "@/ui/filter-button";
import { SearchIcon } from "@/ui/icons";

export function TransactionsPageContent() {
  return (
    <section className="min-h-[660px] w-full rounded-[20px] bg-card px-5 py-8 sm:px-8 lg:px-[50px] lg:py-[40px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          className="flex w-fit items-center gap-[10px] font-heading text-[16px] leading-[20px] font-bold text-card-foreground"
        >
          May - June 2021
          <span
            aria-hidden="true"
            className="mt-[-3px] size-[8px] rotate-45 border-r-2 border-b-2 border-card-foreground"
          />
        </button>

        <div className="flex flex-wrap items-center gap-[15px]">
          <label className="relative h-[30px] w-[173px] shrink-0">
            <span className="sr-only">Search transactions</span>
            <input
              type="text"
              placeholder="Search in table..."
              className="h-full w-full rounded-[10px] border-0 bg-background pl-[15px] pr-[34px] text-[14px] leading-[17px] text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <SearchIcon
              className="pointer-events-none absolute top-1/2 right-[17px] -translate-y-1/2 text-muted-foreground"
              size={12}
            />
          </label>

          <FilterButton />
          <AddButton />
        </div>
      </div>

      <div className="mt-[28px] min-h-[520px] w-full" />
    </section>
  );
}
