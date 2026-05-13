export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UsersPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  items: UserListItem[];
  meta: UsersPaginationMeta;
}
