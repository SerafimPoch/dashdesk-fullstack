import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./users.api";
import type { GetUsersParams } from "./users.types";

const USERS_LIST_QUERY_KEY = ["users", "list"] as const;

export function useUsersListQuery(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: [
      ...USERS_LIST_QUERY_KEY,
      params.page,
      params.limit,
      params.search,
    ],
    queryFn: () => getUsers(params),
    placeholderData: (previousData) => previousData,
  });
}
