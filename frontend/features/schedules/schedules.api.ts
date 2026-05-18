import { apiClient } from "@/lib/api-client";
import type {
  SchedulesListParams,
  SchedulesListResponse,
} from "./schedules.types";

export async function getSchedules(
  params: SchedulesListParams = {},
): Promise<SchedulesListResponse> {
  const response = await apiClient.get<SchedulesListResponse>("/schedules", {
    params,
  });

  return response.data;
}
