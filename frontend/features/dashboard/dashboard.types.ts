interface DashboardActivitiesSeries {
  key: "guest" | "user";
  label: string;
  values: number[];
}

interface DashboardTopProductItem {
  key: "basic-tees" | "custom-short-pants" | "super-hoodies";
  name: string;
  percentage: number;
}

export enum DashboardPeriod {
  LAST_4_WEEKS = "last-4-weeks",
  LAST_8_WEEKS = "last-8-weeks",
  LAST_12_WEEKS = "last-12-weeks",
}

export interface DashboardSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalLikes: number;
  totalUsers: number;
}

export interface DashboardPeriodParams {
  period?: DashboardPeriod;
}

export interface DashboardActivities {
  period: DashboardPeriod;
  periodLabel: string;
  labels: string[];
  series: DashboardActivitiesSeries[];
}

export interface DashboardTopProducts {
  period: DashboardPeriod;
  periodLabel: string;
  items: DashboardTopProductItem[];
}
