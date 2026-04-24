const scheduleItems = [
  {
    id: "kuta-bali",
    title: "Meeting with suppliers from Kuta Bali",
    time: "14.00-15.00",
    location: "at Sunset Road, Kuta, Bali",
    accentColor: "var(--schedule-item-green)",
  },
  {
    id: "giga-factory",
    title: "Check operation at Giga Factory 1",
    time: "18.00-20.00",
    location: "at Central Jakarta",
    accentColor: "var(--schedule-item-purple)",
  },
] as const;

export function DashboardTodayScheduleCard() {
  return (
    <section className="h-[256px] w-full overflow-hidden rounded-[24px] bg-white px-[31px] pt-[30px] pb-[28px]">
      <div className="flex items-start justify-between gap-6">
        <h2 className="font-heading text-[24px] leading-[29px] font-bold text-foreground">
          Today&apos;s schedule
        </h2>
        <div className="text-muted-foreground mt-[5px] inline-flex items-center gap-[6px] text-[12px] leading-[15px]">
          <span>See All</span>
          <svg
            width="6"
            height="11"
            viewBox="0 0 6 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 1L5 5.5L1 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="mt-[28px] space-y-[10px]">
        {scheduleItems.map((item) => (
          <article key={item.id} className="flex items-start gap-[13px]">
            <span
              className="mt-1 h-[62px] w-[5px] shrink-0 rounded-full"
              style={{ backgroundColor: item.accentColor }}
              aria-hidden="true"
            />
            <div className="space-y-[5px]">
              <h3 className="text-[14px] leading-[17px] font-bold text-[var(--schedule-item-foreground)]">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-[12px] leading-[15px]">
                {item.time}
              </p>
              <p className="text-muted-foreground text-[12px] leading-[15px]">
                {item.location}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
