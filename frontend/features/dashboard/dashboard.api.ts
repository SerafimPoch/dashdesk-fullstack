import { apiClient } from "@/lib/api-client";
import type { DashboardSummary } from "./dashboard.types";

export async function getSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>("/dashboard/summary");

  return response.data;
}
