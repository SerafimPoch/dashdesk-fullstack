import { useQuery } from "@tanstack/react-query";
import { getSchedules } from "./schedules.api";

const SCHEDULES_LIST_QUERY_KEY = ["schedules", "list"] as const;

export function useSchedulesListQuery(date?: string) {
  return useQuery({
    queryKey: [...SCHEDULES_LIST_QUERY_KEY, date],
    queryFn: () => getSchedules({ date }),
    placeholderData: (previousData) => previousData,
  });
}
