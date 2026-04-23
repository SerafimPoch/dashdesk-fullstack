import { Skeleton } from "@/ui/skeleton";

export function DashboardActivitiesChartSkeleton() {
  return (
    <section className="rounded-[24px] bg-white px-[31px] pt-[30px] pb-[28px]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Skeleton className="h-[29px] w-[140px] rounded-[8px]" />
          <Skeleton className="mt-[10px] h-[17px] w-[140px] rounded-[6px]" />
        </div>
        <div className="flex items-center gap-8 pt-1">
          <Skeleton className="h-[14px] w-[60px] rounded-[6px]" />
          <Skeleton className="h-[14px] w-[52px] rounded-[6px]" />
        </div>
      </div>

      <div className="mt-[42px]">
        <div className="space-y-[37px]">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-px w-full rounded-none bg-black/8" />
          ))}
        </div>
        <div className="mt-[24px] flex justify-between px-[72px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[17px] w-[72px] rounded-[6px]" />
          ))}
        </div>
      </div>
    </section>
  );
}
