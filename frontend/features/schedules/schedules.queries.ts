import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSchedule, getSchedules } from "./schedules.api";
import type { CreateScheduleBody } from "./schedules.types";

const SCHEDULES_LIST_QUERY_KEY = ["schedules", "list"] as const;

function getSchedulesListQueryKey(date?: string) {
  return [...SCHEDULES_LIST_QUERY_KEY, date] as const;
}

export function useSchedulesListQuery(date?: string) {
  return useQuery({
    queryKey: getSchedulesListQueryKey(date),
    queryFn: () => getSchedules({ date }),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateScheduleMutation(date?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateScheduleBody) => createSchedule(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getSchedulesListQueryKey(date),
      });
    },
  });
}
