"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type { TransactionFilters } from "../transactions.types";

interface TransactionsFilterFormValues {
  product: string;
  minQuantity: string;
  maxQuantity: string;
  minTotal: string;
  maxTotal: string;
}

interface TransactionsFilterFormProps {
  defaultFilters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onClear: () => void;
}

const MAX_INTEGER = 2147483647;

function toCents(amount: string): number {
  const [dollars, cents = ""] = amount.split(".");

  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

function formatCents(amount?: number): string {
  if (amount === undefined) {
    return "";
  }

  return (amount / 100)
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

function toOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

const optionalIntegerSchema = v.pipe(
  v.string(),
  v.regex(/^(?:|\d+)$/, "Enter a whole number"),
  v.check(
    (value) => value === "" || Number(value) <= MAX_INTEGER,
    "Value is too large",
  ),
);

const optionalCurrencySchema = v.pipe(
  v.string(),
  v.regex(/^(?:|\d+(?:\.\d{1,2})?)$/, "Enter a valid USD amount"),
  v.check(
    (value) => value === "" || toCents(value) <= MAX_INTEGER,
    "Value is too large",
  ),
);

const filtersSchema = v.object({
  product: v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(120, "Product must be at most 120 characters"),
  ),
  minQuantity: optionalIntegerSchema,
  maxQuantity: optionalIntegerSchema,
  minTotal: optionalCurrencySchema,
  maxTotal: optionalCurrencySchema,
});

function FilterFieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-xs text-destructive" id={id}>
      {message}
    </p>
  );
}

export function TransactionsFilterForm({
  defaultFilters,
  onApply,
  onClear,
}: TransactionsFilterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TransactionsFilterFormValues>({
    resolver: valibotResolver(filtersSchema),
    defaultValues: {
      product: defaultFilters.product ?? "",
      minQuantity: String(defaultFilters.minQuantity ?? ""),
      maxQuantity: String(defaultFilters.maxQuantity ?? ""),
      minTotal: formatCents(defaultFilters.minTotalCents),
      maxTotal: formatCents(defaultFilters.maxTotalCents),
    },
  });

  const submitFilters = (values: TransactionsFilterFormValues) => {
    const product = values.product.trim();
    const minQuantity = toOptionalNumber(values.minQuantity);
    const maxQuantity = toOptionalNumber(values.maxQuantity);
    const minTotalCents =
      values.minTotal === "" ? undefined : toCents(values.minTotal);
    const maxTotalCents =
      values.maxTotal === "" ? undefined : toCents(values.maxTotal);

    if (
      minQuantity !== undefined &&
      maxQuantity !== undefined &&
      minQuantity > maxQuantity
    ) {
      setError("maxQuantity", {
        message: "Maximum must be greater than or equal to minimum",
      });

      return;
    }

    if (
      minTotalCents !== undefined &&
      maxTotalCents !== undefined &&
      minTotalCents > maxTotalCents
    ) {
      setError("maxTotal", {
        message: "Maximum must be greater than or equal to minimum",
      });

      return;
    }

    onApply({
      ...(product ? { product } : {}),
      ...(minQuantity !== undefined ? { minQuantity } : {}),
      ...(maxQuantity !== undefined ? { maxQuantity } : {}),
      ...(minTotalCents !== undefined ? { minTotalCents } : {}),
      ...(maxTotalCents !== undefined ? { maxTotalCents } : {}),
    });
  };

  return (
    <form
      noValidate
      className="grid gap-[18px]"
      onSubmit={handleSubmit(submitFilters)}
    >
      <div className="grid gap-[8px]">
        <Label
          className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
          htmlFor="filter-product"
        >
          Product
        </Label>
        <Input
          autoComplete="off"
          className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
          id="filter-product"
          placeholder="Basic Tees"
          aria-invalid={Boolean(errors.product)}
          aria-describedby={
            errors.product ? "filter-product-error" : undefined
          }
          {...register("product")}
        />
        <FilterFieldError
          id="filter-product-error"
          message={errors.product?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="filter-min-quantity"
          >
            Min quantity
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="filter-min-quantity"
            inputMode="numeric"
            min="0"
            placeholder="0"
            step="1"
            type="number"
            aria-invalid={Boolean(errors.minQuantity)}
            aria-describedby={
              errors.minQuantity ? "filter-min-quantity-error" : undefined
            }
            {...register("minQuantity")}
          />
          <FilterFieldError
            id="filter-min-quantity-error"
            message={errors.minQuantity?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="filter-max-quantity"
          >
            Max quantity
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="filter-max-quantity"
            inputMode="numeric"
            min="0"
            placeholder="Any"
            step="1"
            type="number"
            aria-invalid={Boolean(errors.maxQuantity)}
            aria-describedby={
              errors.maxQuantity ? "filter-max-quantity-error" : undefined
            }
            {...register("maxQuantity")}
          />
          <FilterFieldError
            id="filter-max-quantity-error"
            message={errors.maxQuantity?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="filter-min-total"
          >
            Min total (USD)
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="filter-min-total"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
            aria-invalid={Boolean(errors.minTotal)}
            aria-describedby={
              errors.minTotal ? "filter-min-total-error" : undefined
            }
            {...register("minTotal")}
          />
          <FilterFieldError
            id="filter-min-total-error"
            message={errors.minTotal?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="filter-max-total"
          >
            Max total (USD)
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="filter-max-total"
            inputMode="decimal"
            min="0"
            placeholder="Any"
            step="0.01"
            type="number"
            aria-invalid={Boolean(errors.maxTotal)}
            aria-describedby={
              errors.maxTotal ? "filter-max-total-error" : undefined
            }
            {...register("maxTotal")}
          />
          <FilterFieldError
            id="filter-max-total-error"
            message={errors.maxTotal?.message}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-[10px] pt-[4px]">
        <Button
          type="button"
          variant="secondary"
          className="h-[38px] rounded-[10px] px-[18px] font-heading text-[14px] font-bold"
          onClick={onClear}
        >
          Clear
        </Button>
        <Button
          type="submit"
          className="h-[38px] rounded-[10px] px-[20px] font-heading text-[14px] font-bold"
        >
          Apply
        </Button>
      </div>
    </form>
  );
}
