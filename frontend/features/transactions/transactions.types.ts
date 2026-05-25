export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  product?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minTotalCents?: number;
  maxTotalCents?: number;
}

export interface TransactionDateRangeOption {
  value: string;
  from: string;
  to: string;
}

export interface TransactionDateRangesResponse {
  items: TransactionDateRangeOption[];
}

export interface TransactionListItem {
  id: string;
  name: string;
  email: string;
  product: string;
  quantity: string;
  total: string;
}

export interface TransactionsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  items: TransactionListItem[];
  meta: TransactionsPaginationMeta;
}

export interface CreateTransactionBody {
  name: string;
  email: string;
  product: string;
  quantity: number;
  totalCents: number;
  date: string;
}

export type TransactionFilters = Pick<
  GetTransactionsParams,
  | "product"
  | "minQuantity"
  | "maxQuantity"
  | "minTotalCents"
  | "maxTotalCents"
>;
