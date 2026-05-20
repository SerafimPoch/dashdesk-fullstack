"use client";

import { format } from "date-fns";

import { AddButton } from "@/ui/add-button";
import { Spinner } from "@/ui/spinner";
import { useSchedulesListQuery } from "../schedules.queries";

const scheduleAccentStyles = {
  green: {
    accentColor: "var(--schedule-item-green)",
    accentHeight: "h-[69px]",
    titleWidth: "w-[206px]",
  },
  purple: {
    accentColor: "var(--schedule-item-purple)",
    accentHeight: "h-[73px]",
    titleWidth: "w-[228px]",
  },
} as const;

interface SchedulesListPanelProps {
  selectedDate: Date;
}

export function SchedulesListPanel({ selectedDate }: SchedulesListPanelProps) {
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const { data, isFetching } = useSchedulesListQuery(selectedDateKey);
  const scheduleItems = data?.items ?? [];

  return (
    <section className="relative h-[546px] w-[320px] rounded-[20px] bg-card px-[40px] pt-[31px]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[18px] leading-[22px] font-bold text-card-foreground">
          Schedules
        </h2>
        <AddButton
          className="h-[32px] w-[80px] cursor-pointer gap-[6px] rounded-[10px] bg-primary px-0 font-heading text-[14px] leading-[17px] font-bold text-primary-foreground hover:bg-primary/90"
          iconClassName="h-[17px] w-[17px]"
          iconSize={17}
        />
      </div>

      <div className="mt-[45px] flex flex-col gap-[25px]">
        {scheduleItems.map((item) => {
          const accent = scheduleAccentStyles[item.accent];

          return (
            <article key={item.id} className="flex gap-[15px]">
              <span
                className={`${accent.accentHeight} block w-[4px] shrink-0`}
                style={{ backgroundColor: accent.accentColor }}
                aria-hidden="true"
              />
              <div className="min-w-0 pt-[4px]">
                <h3
                  className={`${accent.titleWidth} font-sans text-[14px] leading-[17px] font-bold text-[var(--schedule-item-foreground)]`}
                >
                  {item.title}
                </h3>
                <p className="mt-[7px] text-[12px] leading-[15px] text-muted-foreground">
                  {item.time}
                </p>
                <p className="mt-[7px] whitespace-nowrap text-[12px] leading-[15px] text-muted-foreground">
                  {item.location}
                </p>
              </div>
            </article>
          );
        })}
        {scheduleItems.length === 0 && !isFetching && (
          <p className="text-[12px] leading-[15px] text-muted-foreground">
            No schedules
          </p>
        )}
      </div>

      {isFetching && (
        <div className="absolute inset-x-[40px] top-[92px] bottom-[32px] flex items-center justify-center rounded-[16px] bg-card/70 backdrop-blur-[2px]">
          <Spinner
            className="h-10 w-10 text-primary"
            label="Loading schedules"
          />
        </div>
      )}
    </section>
  );
}
