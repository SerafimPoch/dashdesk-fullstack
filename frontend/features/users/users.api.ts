import { apiClient } from "@/lib/api-client";
import type {
  CreateUserBody,
  GetUsersParams,
  UserListItem,
  UsersResponse,
} from "./users.types";

export async function getUsers(
  params: GetUsersParams = {},
): Promise<UsersResponse> {
  const response = await apiClient.get<UsersResponse>("/users", { params });

  return response.data;
}

export async function createUser(
  body: CreateUserBody,
): Promise<UserListItem> {
  const response = await apiClient.post<UserListItem>("/users", body);

  return response.data;
}
