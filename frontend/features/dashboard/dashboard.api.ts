import { apiClient } from "@/lib/api-client";
import type {
  DashboardActivities,
  DashboardActivitiesParams,
  DashboardSummary,
} from "./dashboard.types";

export async function getSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>("/dashboard/summary");

  return response.data;
}

export async function getActivities(
  params: DashboardActivitiesParams,
): Promise<DashboardActivities> {
  const response = await apiClient.get<DashboardActivities>(
    "/dashboard/activities",
    { params },
  );

  return response.data;
}
