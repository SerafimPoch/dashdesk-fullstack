import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  getTransactionDateRanges,
  getTransactions,
} from "./transactions.api";
import type {
  CreateTransactionBody,
  GetTransactionsParams,
} from "./transactions.types";

const TRANSACTIONS_LIST_QUERY_KEY = ["transactions", "list"] as const;
const TRANSACTIONS_DATE_RANGES_QUERY_KEY = [
  "transactions",
  "date-ranges",
] as const;

export function useTransactionDateRangesQuery() {
  return useQuery({
    queryKey: TRANSACTIONS_DATE_RANGES_QUERY_KEY,
    queryFn: getTransactionDateRanges,
  });
}

export function useTransactionsListQuery(
  params: GetTransactionsParams = {},
) {
  return useQuery({
    queryKey: [
      ...TRANSACTIONS_LIST_QUERY_KEY,
      params.page,
      params.limit,
      params.search,
      params.from,
      params.to,
      params.product,
      params.minQuantity,
      params.maxQuantity,
      params.minTotalCents,
      params.maxTotalCents,
    ],
    queryFn: () => getTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTransactionBody) => createTransaction(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TRANSACTIONS_LIST_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: TRANSACTIONS_DATE_RANGES_QUERY_KEY,
        }),
      ]);
    },
  });
}
