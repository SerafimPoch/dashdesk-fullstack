export type DashboardActivitiesSeries = {
  key: "guest" | "user";
  label: string;
  values: number[];
};

export type DashboardActivitiesPeriod =
  | "last-4-weeks"
  | "last-8-weeks"
  | "last-12-weeks";

export interface DashboardSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalLikes: number;
  totalUsers: number;
}

export interface DashboardActivitiesParams {
  period?: DashboardActivitiesPeriod;
}

export interface DashboardActivities {
  period: "last-4-weeks" | "last-8-weeks" | "last-12-weeks";
  periodLabel: string;
  labels: string[];
  series: DashboardActivitiesSeries[];
}
