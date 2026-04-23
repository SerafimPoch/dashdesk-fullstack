"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { getActivities } from "../dashboard.api";
import type { DashboardActivitiesPeriod } from "../dashboard.types";
import { DashboardActivitiesChartSkeleton } from "./DashboardActivitiesChartSkeleton";

const DEFAULT_PERIOD: DashboardActivitiesPeriod = "last-4-weeks";
const Y_AXIS_TICKS = [0, 100, 200, 300, 400, 500];
const INITIAL_CHART_DIMENSION = { width: 938, height: 260 };
const GUEST_STROKE = "var(--chart-guest)";
const USER_STROKE = "var(--chart-user)";
const GRID_STROKE = "var(--chart-grid)";
const AXIS_TEXT = "var(--muted-foreground)";

const periodOptions: {
  value: DashboardActivitiesPeriod;
  label: string;
}[] = [
  { value: "last-4-weeks", label: "Last 4 Weeks" },
  { value: "last-8-weeks", label: "Last 8 Weeks" },
  { value: "last-12-weeks", label: "Last 12 Weeks" },
];

interface ChartRow {
  label: string;
  guest: number;
  user: number;
}

export function DashboardActivitiesChart() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardActivitiesPeriod>(DEFAULT_PERIOD);

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-activities", selectedPeriod],
    queryFn: () => getActivities({ period: selectedPeriod }),
  });

  const chartData = useMemo<ChartRow[]>(() => {
    if (!data) {
      return [];
    }

    const guestSeries = data.series.find((series) => series.key === "guest");
    const userSeries = data.series.find((series) => series.key === "user");

    return data.labels.map((label, index) => ({
      label,
      guest: guestSeries?.values[index] ?? 0,
      user: userSeries?.values[index] ?? 0,
    }));
  }, [data]);

  if (isFetching) {
    return <DashboardActivitiesChartSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <section className="rounded-[24px] bg-white px-[31px] pt-[30px] pb-[22px]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-heading text-[24px] leading-[29px] font-bold text-foreground">
            Activities
          </h2>
          <label className="text-muted-foreground relative mt-[10px] inline-flex items-center">
            <select
              aria-label="Activities period"
              className="appearance-none bg-transparent pr-[18px] text-[18px] leading-[22px] outline-none"
              value={selectedPeriod}
              onChange={(event) =>
                setSelectedPeriod(
                  event.target.value as DashboardActivitiesPeriod,
                )
              }
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2"
              width="9"
              height="6"
              viewBox="0 0 9 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 1.25L4.5 4.75L8 1.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        </div>
        <div className="flex items-center gap-[36px] pt-1">
          <div className="flex items-center gap-[10px]">
            <span className="h-[10px] w-[10px] rounded-full bg-[var(--chart-guest)]" />
            <span className="text-[14px] leading-[17px] text-foreground">
              Guest
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="h-[10px] w-[10px] rounded-full bg-[var(--chart-user)]" />
            <span className="text-[14px] leading-[17px] text-foreground">
              User
            </span>
          </div>
        </div>
      </div>
      <div className="mt-[24px] h-[260px] min-w-0 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={260}
          initialDimension={INITIAL_CHART_DIMENSION}
        >
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 24, bottom: 4, left: 8 }}
          >
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              height={30}
              tickMargin={10}
              tick={{ fill: AXIS_TEXT, fontSize: 14 }}
              interval={0}
              padding={{ left: 18, right: 18 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={36}
              domain={[0, 500]}
              ticks={Y_AXIS_TICKS}
              tick={{ fill: AXIS_TEXT, fontSize: 14 }}
            />
            <Line
              type="monotone"
              dataKey="guest"
              stroke={GUEST_STROKE}
              strokeWidth={4}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="user"
              stroke={USER_STROKE}
              strokeWidth={4}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
