"use client";

import { useState } from "react";
import { SchedulesCalendar } from "./SchedulesCalendar";
import { SchedulesListPanel } from "./SchedulesListPanel";

export function SchedulesPageContent() {
  const [selectedDate, setSelectedDate] = useState(() => new Date(2021, 5, 5));

  return (
    <div className="grid w-full gap-[24px] xl:grid-cols-[minmax(0,640px)_320px] xl:gap-[36px]">
      <SchedulesCalendar
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
      />
      <SchedulesListPanel selectedDate={selectedDate} />
    </div>
  );
}
