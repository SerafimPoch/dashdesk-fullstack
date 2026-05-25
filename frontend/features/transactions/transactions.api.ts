import { apiClient } from "@/lib/api-client";
import type {
  CreateTransactionBody,
  GetTransactionsParams,
  TransactionListItem,
  TransactionDateRangesResponse,
  TransactionsResponse,
} from "./transactions.types";

export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<TransactionsResponse> {
  const response = await apiClient.get<TransactionsResponse>("/transactions", {
    params,
  });

  return response.data;
}

export async function getTransactionDateRanges(): Promise<TransactionDateRangesResponse> {
  const response = await apiClient.get<TransactionDateRangesResponse>(
    "/transactions/date-ranges",
  );

  return response.data;
}

export async function createTransaction(
  body: CreateTransactionBody,
): Promise<TransactionListItem> {
  const response = await apiClient.post<TransactionListItem>(
    "/transactions",
    body,
  );

  return response.data;
}
