import { apiClient } from "@/lib/api-client";
import type {
  CreateScheduleBody,
  ScheduleItem,
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

export async function createSchedule(
  body: CreateScheduleBody,
): Promise<ScheduleItem> {
  const response = await apiClient.post<ScheduleItem>("/schedules", body);

  return response.data;
}
