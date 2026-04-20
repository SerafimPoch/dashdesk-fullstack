"use client";

import Link from "next/link";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as v from "valibot";

import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import {
  AppleIcon,
  CheckIcon,
  EyeClosedIcon,
  EyeIcon,
  GoogleIcon,
} from "@/ui/icons";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { signUp } from "../api/auth-api";
import type { SignUpBody } from "../api/auth-api";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
}

const registerSchema = v.object({
  firstName: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "First name must be at least 2 characters"),
    v.maxLength(50, "First name must be at most 50 characters"),
  ),
  lastName: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "Last name must be at least 2 characters"),
    v.maxLength(50, "Last name must be at most 50 characters"),
  ),
  email: v.pipe(v.string(), v.email("Enter a valid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
    v.maxLength(64, "Password must be at most 64 characters"),
  ),
  confirmPassword: v.pipe(
    v.string(),
    v.minLength(8, "Confirm password must be at least 8 characters"),
  ),
  agreement: v.boolean(),
});

export function RegisterPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: valibotResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreement: false,
    },
  });

  const agreementChecked = useWatch({
    control,
    name: "agreement",
    defaultValue: false,
  });

  const onSubmit = async (values: RegisterFormValues) => {
    clearErrors(["confirmPassword", "agreement"]);
    setServerError(null);

    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    if (!values.agreement) {
      setError("agreement", {
        type: "manual",
        message: "You must agree to the terms and conditions",
      });
      return;
    }

    const payload: SignUpBody = {
      name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
      email: values.email,
      password: values.password,
    };

    try {
      await signUp(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setServerError(message);
    }
  };

  return (
    <div className="w-[385px] max-w-full">
      <h1 className="font-heading text-[36px] leading-[44px] font-bold text-foreground">
        Create an account
      </h1>
      <p className="mt-[5px] text-base leading-[19px] text-foreground">
        Create an account to use dashboard
      </p>

      <div className="mt-[26px] grid grid-cols-2 gap-[25px]">
        <Button
          type="button"
          variant="secondary"
          className="h-[30px] w-[180px] rounded-[10px] border-0 bg-secondary px-0 text-[12px] font-heading font-normal text-muted-foreground shadow-none hover:bg-secondary"
        >
          <GoogleIcon className="h-[14px] w-[14px]" />
          <span className="ml-2 leading-[15px]">Sign up with Google</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-[30px] w-[180px] rounded-[10px] border-0 bg-secondary px-0 text-[12px] font-heading font-normal text-muted-foreground shadow-none hover:bg-secondary"
        >
          <AppleIcon className="h-[14px] w-[11.5px] text-[#999999]" />
          <span className="ml-2 leading-[15px]">Sign up with Apple</span>
        </Button>
      </div>

      <div className="mt-[25px] rounded-[20px] bg-card px-[30px] py-[30px]">
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-[25px]">
            <div>
              <Label
                className="text-base leading-[19px] font-normal text-foreground"
                htmlFor="firstName"
              >
                First Name
              </Label>
              <Input
                autoComplete="given-name"
                className="mt-[10px] h-10 rounded-[10px] border-0 bg-input px-[15px] text-base shadow-none focus-visible:ring-2"
                id="firstName"
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                className="text-base leading-[19px] font-normal text-foreground"
                htmlFor="lastName"
              >
                Last Name
              </Label>
              <Input
                autoComplete="family-name"
                className="mt-[10px] h-10 rounded-[10px] border-0 bg-input px-[15px] text-base shadow-none focus-visible:ring-2"
                id="lastName"
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-[20px]">
            <Label
              className="text-base leading-[19px] font-normal text-foreground"
              htmlFor="email"
            >
              Email address
            </Label>
            <Input
              autoComplete="email"
              className="mt-[10px] h-10 rounded-[10px] border-0 bg-input px-[15px] text-base shadow-none focus-visible:ring-2"
              id="email"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="mt-[20px]">
            <Label
              className="text-base leading-[19px] font-normal text-foreground"
              htmlFor="password"
            >
              Password
            </Label>
            <div className="relative mt-[10px]">
              <Input
                autoComplete="new-password"
                className="h-10 rounded-[10px] border-0 bg-input px-[15px] pr-11 text-base shadow-none focus-visible:ring-2"
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute top-1/2 right-[15px] -translate-y-1/2 text-[#999999]"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeClosedIcon className="h-5 w-5 text-[#999999]" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-[#999999]" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="mt-[20px]">
            <Label
              className="text-base leading-[19px] font-normal text-foreground"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </Label>
            <div className="relative mt-[10px]">
              <Input
                autoComplete="new-password"
                className="h-10 rounded-[10px] border-0 bg-input px-[15px] pr-11 text-base shadow-none focus-visible:ring-2"
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute top-1/2 right-[15px] -translate-y-1/2 text-[#999999]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <EyeClosedIcon className="h-5 w-5 text-[#999999]" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-[#999999]" />
                )}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div className="mt-[20px]">
            <label className="flex items-start gap-[10px]">
              <input
                className="peer sr-only"
                type="checkbox"
                {...register("agreement")}
              />
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-[3px] bg-primary text-primary-foreground">
                {agreementChecked ? (
                  <CheckIcon className="h-[7px] w-[9px] text-primary-foreground" />
                ) : null}
              </span>
              <span className="text-base leading-[19px] text-muted-foreground">
                I agree the{" "}
                <Link
                  className="hover:underline"
                  href="#"
                  style={{ color: "var(--link)" }}
                >
                  terms and conditions
                </Link>
              </span>
            </label>
            {errors.agreement ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.agreement.message}
              </p>
            ) : null}
          </div>

          <AuthSubmitButton
            className="mt-[20px]"
            loading={isSubmitting}
            loadingText="Creating account..."
          >
            Sign Up
          </AuthSubmitButton>

          {serverError ? (
            <p className="mt-3 text-sm text-destructive">{serverError}</p>
          ) : null}
        </form>
      </div>

      <p className="mt-[20px] text-center text-base leading-[19px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="hover:underline"
          href="/"
          style={{ color: "var(--link)" }}
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}
