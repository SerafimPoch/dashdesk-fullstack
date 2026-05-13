import { apiClient } from "@/lib/api-client";
import type { GetUsersParams, UsersResponse } from "./users.types";

export async function getUsers(
  params: GetUsersParams = {},
): Promise<UsersResponse> {
  const response = await apiClient.get<UsersResponse>("/users", { params });

  return response.data;
}
