import { apiClient } from "@/lib/api-client";
import type {
  DashboardActivities,
  DashboardPeriodParams,
  DashboardSummary,
  DashboardTopProducts,
} from "./dashboard.types";

export async function getSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>("/dashboard/summary");

  return response.data;
}

export async function getActivities(
  params: DashboardPeriodParams,
): Promise<DashboardActivities> {
  const response = await apiClient.get<DashboardActivities>(
    "/dashboard/activities",
    { params },
  );

  return response.data;
}

export async function getTopProducts(
  params: DashboardPeriodParams,
): Promise<DashboardTopProducts> {
  const response = await apiClient.get<DashboardTopProducts>(
    "/dashboard/top-products",
    { params },
  );

  return response.data;
}
