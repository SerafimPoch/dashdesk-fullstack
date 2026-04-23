"use client";

import type { ReactNode } from "react";
import {
  TotalLikesIcon,
  TotalRevenueIcon,
  TotalTransactionsIcon,
  TotalUsersIcon,
} from "@/ui/icons";
import type { DashboardSummary } from "../dashboard.types";
import { DashboardSummaryCardsSkeleton } from "./DashboardSummaryCardsSkeleton";
import { SummaryCard } from "./SummaryCard";
import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../dashboard.api";

interface SummaryCardConfig {
  key: keyof DashboardSummary;
  title: string;
  backgroundClassName: string;
  icon: ReactNode;
  format: (value: number) => string;
}

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const cardConfigs: SummaryCardConfig[] = [
  {
    key: "totalRevenue",
    title: "Total Revenues",
    backgroundClassName: "bg-[#E5F3E8]",
    icon: <TotalRevenueIcon />,
    format: (value) => currencyFormatter.format(value),
  },
  {
    key: "totalTransactions",
    title: "Total Transactions",
    backgroundClassName: "bg-[#F8F0DE]",
    icon: <TotalTransactionsIcon />,
    format: (value) => numberFormatter.format(value),
  },
  {
    key: "totalLikes",
    title: "Total Likes",
    backgroundClassName: "bg-[#F4E1E2]",
    icon: <TotalLikesIcon />,
    format: (value) => numberFormatter.format(value),
  },
  {
    key: "totalUsers",
    title: "Total Users",
    backgroundClassName: "bg-[#E5E6F8]",
    icon: <TotalUsersIcon />,
    format: (value) => numberFormatter.format(value),
  },
];

export function DashboardSummaryCards() {
  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getSummary,
  });

  if (isFetching) {
    return <DashboardSummaryCardsSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <section
      aria-label="Dashboard summary"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[36px]"
    >
      {cardConfigs.map((card) => (
        <SummaryCard
          key={card.key}
          title={card.title}
          value={card.format(data[card.key])}
          backgroundClassName={card.backgroundClassName}
          icon={card.icon}
        />
      ))}
    </section>
  );
}
