"use client";

import {
  addDays,
  addMonths,
  format,
  getDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const calendarCellClass =
  "flex size-[80px] items-center justify-center border border-card text-center text-[16px] leading-none transition-colors";

interface SchedulesCalendarProps {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
}

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[16px]", direction === "previous" && "rotate-180")}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SchedulesCalendar({
  selectedDate,
  onSelectedDateChange,
}: SchedulesCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDate),
  );
  const calendarDays = useMemo(() => {
    const firstVisibleDay = startOfWeek(startOfMonth(visibleMonth), {
      weekStartsOn: 0,
    });

    return Array.from({ length: 35 }, (_, index) =>
      addDays(firstVisibleDay, index),
    );
  }, [visibleMonth]);

  return (
    <section className="h-[546px] w-full max-w-[640px] overflow-x-auto rounded-[20px] bg-card px-[40px] pt-[30px]">
      <div className="min-w-[560px]">
        <div className="flex items-start justify-between">
          <h2 className="font-heading text-[24px] leading-[29px] font-bold text-card-foreground">
            {format(visibleMonth, "MMMM yyyy")}
          </h2>

          <div className="mr-[20px] mt-[3px] flex items-center gap-[20px]">
            <button
              type="button"
              className="flex size-[16px] cursor-pointer items-center justify-center text-card-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
            >
              <ChevronIcon direction="previous" />
            </button>
            <button
              type="button"
              className="flex size-[16px] cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              <ChevronIcon direction="next" />
            </button>
          </div>
        </div>

        <div className="mt-[17px] grid grid-cols-7">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="flex h-[40px] w-[80px] items-center justify-center px-[10px] py-[10px]"
            >
              <span
                className={cn(
                  "font-sans text-[12px] leading-[15px] font-semibold text-card-foreground",
                  weekday === "Wednesday" ? "w-[70px]" : "w-[60px]",
                )}
              >
                {weekday}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isInactive = !isSameMonth(day, visibleMonth);

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={cn(
                  calendarCellClass,
                  "cursor-pointer font-sans text-card-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring",
                  isInactive &&
                    "bg-card text-[#9c8d8d] hover:text-card-foreground",
                  isSelected &&
                    "rounded-[30px] bg-[#fff2d9] font-semibold text-card-foreground hover:bg-[#fff2d9]",
                )}
                aria-label={format(day, "MMMM d, yyyy")}
                aria-current={isSelected ? "date" : undefined}
                onClick={() => onSelectedDateChange(day)}
              >
                {getDate(day)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
