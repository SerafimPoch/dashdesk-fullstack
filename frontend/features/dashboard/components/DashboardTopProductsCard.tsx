"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { Spinner } from "@/ui/spinner";
import { getTopProducts } from "../dashboard.api";
import type { DashboardTopProducts } from "../dashboard.types";
import { DashboardPeriod } from "../dashboard.types";

const DEFAULT_PERIOD = DashboardPeriod.LAST_4_WEEKS;

const periodOptions: {
  value: DashboardPeriod;
  label: string;
}[] = [
  { value: DashboardPeriod.LAST_4_WEEKS, label: "Last 4 Weeks" },
  { value: DashboardPeriod.LAST_8_WEEKS, label: "Last 8 Weeks" },
  { value: DashboardPeriod.LAST_12_WEEKS, label: "Last 12 Weeks" },
];

type TopProductItem = DashboardTopProducts["items"][number];

const productColors = {
  "basic-tees": "var(--top-products-basic)",
  "custom-short-pants": "var(--top-products-short-pants)",
  "super-hoodies": "var(--top-products-hoodies)",
} satisfies Record<TopProductItem["key"], string>;

export function DashboardTopProductsCard() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardPeriod>(DEFAULT_PERIOD);

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-top-products", selectedPeriod],
    queryFn: () => getTopProducts({ period: selectedPeriod }),
    placeholderData: (previousData) => previousData,
  });

  if (!data && !isFetching) {
    return null;
  }

  const selectedPeriodOption = periodOptions.find(
    (option) => option.value === selectedPeriod,
  );
  const products = data?.items ?? [];
  const chartData = products.map((item) => ({
    ...item,
    fill: productColors[item.key],
  }));

  return (
    <section className="relative h-[256px] w-full overflow-hidden rounded-[24px] bg-white px-[31px] pt-[30px] pb-[28px]">
      <div className="flex items-start justify-between gap-6">
        <h2 className="font-heading text-[24px] leading-[29px] font-bold text-foreground">
          Top products
        </h2>

        <label className="text-muted-foreground relative mt-[5px] inline-flex items-center">
          <span className="pr-[18px] text-[18px] leading-[22px]">
            {data?.periodLabel ?? selectedPeriodOption?.label}
          </span>
          <select
            aria-label="Top products period"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={selectedPeriod}
            onChange={(event) =>
              setSelectedPeriod(event.target.value as DashboardPeriod)
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

      <div
        className={cn(
          "mt-[29px] flex min-h-[144px] flex-col items-start gap-[24px] transition-opacity duration-200 sm:flex-row sm:items-center sm:gap-[36px]",
          isFetching && "opacity-25",
          !data && "opacity-0",
        )}
      >
        <div className="shrink-0">
          <PieChart width={144} height={144}>
            <Pie
              data={chartData}
              dataKey="percentage"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={72}
              startAngle={270}
              endAngle={-90}
              stroke="none"
              isAnimationActive={false}
            />
          </PieChart>
        </div>
        <div className="min-w-0 flex-1 space-y-[18px]">
          {products.map((item) => (
            <article key={item.key} className="flex items-start gap-[14px]">
              <span
                className="mt-[4px] h-[10px] w-[10px] shrink-0 rounded-full"
                style={{ backgroundColor: productColors[item.key] }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h3 className="truncate text-[14px] leading-[17px] font-bold text-foreground">
                  {item.name}
                </h3>
                <p className="text-muted-foreground mt-[5px] text-[12px] leading-[15px]">
                  {item.percentage}%
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
      {isFetching && (
        <div className="absolute inset-x-[31px] top-[74px] bottom-[28px] flex items-center justify-center rounded-[20px] bg-white/70 backdrop-blur-[2px]">
          <Spinner
            className="h-11 w-11 text-primary"
            label="Loading top products"
          />
        </div>
      )}
    </section>
  );
}
