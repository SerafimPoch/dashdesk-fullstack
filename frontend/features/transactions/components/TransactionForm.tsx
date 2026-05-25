"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type { CreateTransactionBody } from "../transactions.types";

interface TransactionFormValues {
  name: string;
  email: string;
  product: string;
  date: string;
  quantity: string;
  total: string;
}

interface TransactionFormProps {
  errorMessage?: string;
  onCancel?: () => void;
  onSubmit?: (payload: CreateTransactionBody) => Promise<void> | void;
}

const MAX_INTEGER = 2147483647;

function toCents(amount: string): number {
  const [dollars, cents = ""] = amount.split(".");

  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

const transactionFormSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Name must be at least 2 characters"),
    v.maxLength(100, "Name must be at most 100 characters"),
  ),
  email: v.pipe(
    v.string(),
    v.trim(),
    v.email("Enter a valid email address"),
    v.maxLength(254, "Email must be at most 254 characters"),
  ),
  product: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Product must be at least 2 characters"),
    v.maxLength(120, "Product must be at most 120 characters"),
  ),
  date: v.pipe(v.string(), v.minLength(1, "Select a date")),
  quantity: v.pipe(
    v.string(),
    v.minLength(1, "Enter a quantity"),
    v.regex(/^[1-9]\d*$/, "Enter a whole quantity above zero"),
    v.check((value) => Number(value) <= MAX_INTEGER, "Quantity is too large"),
  ),
  total: v.pipe(
    v.string(),
    v.minLength(1, "Enter a total"),
    v.regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid USD amount"),
    v.check((value) => toCents(value) <= MAX_INTEGER, "Total is too large"),
  ),
});

function FormFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-xs text-destructive" id={id}>
      {message}
    </p>
  );
}

export function TransactionForm({
  errorMessage,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: valibotResolver(transactionFormSchema),
    defaultValues: {
      name: "",
      email: "",
      product: "",
      date: "",
      quantity: "",
      total: "",
    },
  });

  const submitTransactionForm = async (values: TransactionFormValues) => {
    await onSubmit?.({
      name: values.name.trim(),
      email: values.email.trim(),
      product: values.product.trim(),
      quantity: Number(values.quantity),
      totalCents: toCents(values.total),
      date: values.date,
    });
  };

  return (
    <form
      noValidate
      className="grid gap-[18px]"
      onSubmit={handleSubmit(submitTransactionForm)}
    >
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-name"
          >
            Name
          </Label>
          <Input
            autoComplete="name"
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-name"
            placeholder="Robert Thomas"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name ? "transaction-name-error" : undefined
            }
            {...register("name")}
          />
          <FormFieldError
            id="transaction-name-error"
            message={errors.name?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-email"
          >
            Email
          </Label>
          <Input
            autoComplete="email"
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-email"
            type="email"
            placeholder="robert.thomas@gmail.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "transaction-email-error" : undefined
            }
            {...register("email")}
          />
          <FormFieldError
            id="transaction-email-error"
            message={errors.email?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-product"
          >
            Product
          </Label>
          <Input
            autoComplete="off"
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-product"
            placeholder="Basic Tees"
            aria-invalid={Boolean(errors.product)}
            aria-describedby={
              errors.product ? "transaction-product-error" : undefined
            }
            {...register("product")}
          />
          <FormFieldError
            id="transaction-product-error"
            message={errors.product?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-date"
          >
            Date
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={
              errors.date ? "transaction-date-error" : undefined
            }
            {...register("date")}
          />
          <FormFieldError
            id="transaction-date-error"
            message={errors.date?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-quantity"
          >
            Quantity
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-quantity"
            inputMode="numeric"
            min="1"
            placeholder="150"
            step="1"
            type="number"
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={
              errors.quantity ? "transaction-quantity-error" : undefined
            }
            {...register("quantity")}
          />
          <FormFieldError
            id="transaction-quantity-error"
            message={errors.quantity?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="transaction-total"
          >
            Total (USD)
          </Label>
          <Input
            className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
            id="transaction-total"
            inputMode="decimal"
            min="0"
            placeholder="3000.00"
            step="0.01"
            type="number"
            aria-invalid={Boolean(errors.total)}
            aria-describedby={
              errors.total ? "transaction-total-error" : undefined
            }
            {...register("total")}
          />
          <FormFieldError
            id="transaction-total-error"
            message={errors.total?.message}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-[10px] pt-[4px]">
        <Button
          type="button"
          variant="secondary"
          className="h-[38px] rounded-[10px] px-[18px] font-heading text-[14px] font-bold"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-[38px] rounded-[10px] px-[20px] font-heading text-[14px] font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
      {errorMessage ? (
        <p className="text-right text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </form>
  );
}
