"use client";

import { format, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { useState } from "react";

import { AddButton } from "@/ui/add-button";
import { Popup } from "@/ui/popup";
import { Spinner } from "@/ui/spinner";
import {
  useCreateScheduleMutation,
  useSchedulesListQuery,
} from "../schedules.queries";

const ScheduleForm = dynamic(
  () => import("./ScheduleForm").then((module) => module.ScheduleForm),
  {
    loading: () => (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" label="Loading form" />
      </div>
    ),
  },
);

const scheduleAccentStyles = {
  GREEN: {
    accentColor: "var(--schedule-item-green)",
    accentHeight: "h-[69px]",
    titleWidth: "w-[206px]",
  },
  PURPLE: {
    accentColor: "var(--schedule-item-purple)",
    accentHeight: "h-[73px]",
    titleWidth: "w-[228px]",
  },
} as const;

function getScheduleAccentStyle(accent: string) {
  if (accent === "PURPLE" || accent === "purple") {
    return scheduleAccentStyles.PURPLE;
  }

  return scheduleAccentStyles.GREEN;
}

interface SchedulesListPanelProps {
  selectedDate: Date;
}

export function SchedulesListPanel({ selectedDate }: SchedulesListPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const { data, isFetching } = useSchedulesListQuery(selectedDateKey);
  const createScheduleMutation = useCreateScheduleMutation(selectedDateKey);
  const scheduleItems = data?.items ?? [];
  const createScheduleError =
    createScheduleMutation.error instanceof Error
      ? createScheduleMutation.error.message
      : undefined;

  const handleCreateOpenChange = (open: boolean) => {
    if (open) {
      createScheduleMutation.reset();
    }

    setIsCreateOpen(open);
  };

  return (
    <section className="relative h-[546px] w-[320px] rounded-[20px] bg-card px-[40px] pt-[31px]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[18px] leading-[22px] font-bold text-card-foreground">
          Schedules
        </h2>
        <Popup
          open={isCreateOpen}
          onOpenChange={handleCreateOpenChange}
          title="Add schedule"
          description={format(selectedDate, "MMMM d, yyyy")}
          className="max-w-[520px] rounded-[20px]"
          contentClassName="pt-[2px]"
          trigger={
            <AddButton
              className="h-[32px] w-[80px] cursor-pointer gap-[6px] rounded-[10px] bg-primary px-0 font-heading text-[14px] leading-[17px] font-bold text-primary-foreground hover:bg-primary/90"
              iconClassName="h-[17px] w-[17px]"
              iconSize={17}
            />
          }
        >
          <ScheduleForm
            key={selectedDateKey}
            defaultDate={selectedDateKey}
            errorMessage={createScheduleError}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={async (payload) => {
              await createScheduleMutation.mutateAsync(payload);
              setIsCreateOpen(false);
            }}
          />
        </Popup>
      </div>

      <div className="mt-[45px] flex flex-col gap-[25px]">
        {scheduleItems.map((item) => {
          const accent = getScheduleAccentStyle(item.accent);
          const time = `${format(parseISO(item.startsAt), "HH.mm")}-${format(
            parseISO(item.endsAt),
            "HH.mm",
          )}`;

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
                  {time}
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
