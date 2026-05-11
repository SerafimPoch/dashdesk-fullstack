import { useQuery } from "@tanstack/react-query";
import { getActivities, getSummary, getTopProducts } from "./dashboard.api";
import type { DashboardPeriod } from "./dashboard.types";

const DASHBOARD_ACTIVITIES_QUERY_KEY = ["dashboard", "activities"] as const;
const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboard", "summary"] as const;
const DASHBOARD_TOP_PRODUCTS_QUERY_KEY = ["dashboard", "top-products"] as const;

export function useDashboardActivitiesQuery(period: DashboardPeriod) {
  return useQuery({
    queryKey: [...DASHBOARD_ACTIVITIES_QUERY_KEY, period],
    queryFn: () => getActivities({ period }),
    placeholderData: (previousData) => previousData,
  });
}

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: getSummary,
  });
}

export function useDashboardTopProductsQuery(period: DashboardPeriod) {
  return useQuery({
    queryKey: [...DASHBOARD_TOP_PRODUCTS_QUERY_KEY, period],
    queryFn: () => getTopProducts({ period }),
    placeholderData: (previousData) => previousData,
  });
}
