import { Skeleton } from "@/ui/skeleton";

const skeletonCardBackgrounds = [
  "bg-[#E5F3E8]",
  "bg-[#F8F0DE]",
  "bg-[#F4E1E2]",
  "bg-[#E5E6F8]",
];

export function DashboardSummaryCardsSkeleton() {
  return (
    <section
      aria-label="Dashboard summary loading"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[36px]"
    >
      {skeletonCardBackgrounds.map((backgroundClassName) => (
        <article
          key={backgroundClassName}
          className={`rounded-[24px] px-[26px] py-[24px] ${backgroundClassName}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 pt-[10px]">
              <Skeleton className="h-[17px] w-[110px] rounded-[6px]" />
              <Skeleton className="mt-[10px] h-[29px] w-[140px] rounded-[8px]" />
            </div>
            <Skeleton className="h-[24px] w-[37px] shrink-0 rounded-[8px]" />
          </div>
        </article>
      ))}
    </section>
  );
}
