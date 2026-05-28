import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, getUsers } from "./users.api";
import type { CreateUserBody, GetUsersParams } from "./users.types";

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

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USERS_LIST_QUERY_KEY,
      });
    },
  });
}
