"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { Button } from "@/ui/button";
import { EyeClosedIcon, EyeIcon } from "@/ui/icons";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type { CreateUserBody } from "../users.types";

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UserFormProps {
  errorMessage?: string;
  onCancel?: () => void;
  onSubmit?: (payload: CreateUserBody) => Promise<void> | void;
}

const userFormSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Name must be at least 2 characters"),
    v.maxLength(50, "Name must be at most 50 characters"),
  ),
  email: v.pipe(
    v.string(),
    v.trim(),
    v.email("Enter a valid email address"),
    v.maxLength(254, "Email must be at most 254 characters"),
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
    v.maxLength(64, "Password must be at most 64 characters"),
  ),
  confirmPassword: v.pipe(
    v.string(),
    v.minLength(8, "Confirm password must be at least 8 characters"),
    v.maxLength(64, "Confirm password must be at most 64 characters"),
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

export function UserForm({ errorMessage, onCancel, onSubmit }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: valibotResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitUserForm = async (values: UserFormValues) => {
    clearErrors("confirmPassword");

    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    await onSubmit?.({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });
  };

  return (
    <form
      noValidate
      className="grid gap-[18px]"
      onSubmit={handleSubmit(submitUserForm)}
    >
      <div className="grid gap-[8px]">
        <Label
          className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
          htmlFor="user-name"
        >
          Name
        </Label>
        <Input
          autoComplete="name"
          className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
          id="user-name"
          placeholder="Robert Thomas"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "user-name-error" : undefined}
          {...register("name")}
        />
        <FormFieldError id="user-name-error" message={errors.name?.message} />
      </div>

      <div className="grid gap-[8px]">
        <Label
          className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
          htmlFor="user-email"
        >
          Email
        </Label>
        <Input
          autoComplete="email"
          className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] text-[14px] shadow-none"
          id="user-email"
          placeholder="robert.thomas@gmail.com"
          type="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "user-email-error" : undefined}
          {...register("email")}
        />
        <FormFieldError id="user-email-error" message={errors.email?.message} />
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="user-password"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] pr-11 text-[14px] shadow-none"
              id="user-password"
              type={showPassword ? "text" : "password"}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "user-password-error" : undefined
              }
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-[13px] flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeClosedIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <FormFieldError
            id="user-password-error"
            message={errors.password?.message}
          />
        </div>

        <div className="grid gap-[8px]">
          <Label
            className="font-heading text-[13px] leading-[16px] font-bold text-card-foreground"
            htmlFor="user-confirm-password"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-[42px] rounded-[12px] border-0 bg-input px-[14px] pr-11 text-[14px] shadow-none"
              id="user-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? "user-confirm-password-error"
                  : undefined
              }
              {...register("confirmPassword")}
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
              className="absolute top-1/2 right-[13px] flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => setShowConfirmPassword((value) => !value)}
            >
              {showConfirmPassword ? (
                <EyeClosedIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <FormFieldError
            id="user-confirm-password-error"
            message={errors.confirmPassword?.message}
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
