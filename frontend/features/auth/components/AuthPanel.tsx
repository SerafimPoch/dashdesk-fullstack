"use client";

import Link from "next/link";
import Image from "next/image";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Apple } from "lucide-react";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import { useRouter } from "next/navigation";

import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe, login } from "../api/auth-api";
import type { LoginBody } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";
import { useAccountStore } from "@/features/account/model/account-store";

const signInSchema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email address")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
  ),
});

export function AuthPanel() {
  const router = useRouter();

  const clearCurrentUser = useAccountStore((state) => state.clearCurrentUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const setCurrentUser = useAccountStore((state) => state.setCurrentUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginBody>({
    resolver: valibotResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginBody) => {
    try {
      const data = await login(values);
      setAccessToken(data.accessToken);

      const user = await getMe();
      setCurrentUser(user);

      router.push("/dashboard");
    } catch {
      clearCurrentUser();
      clearAccessToken();
    }
  };

  return (
    <div className="w-[385px] max-w-full">
      <h1 className="font-heading text-[36px] leading-[44px] font-bold text-foreground">
        Sign In
      </h1>
      <p className="mt-[5px] text-base leading-[19px] text-foreground">
        Sign in to your account
      </p>

      <div className="mt-[26px] grid grid-cols-2 gap-[25px]">
        <Button
          type="button"
          variant="secondary"
          className="h-[30px] w-[180px] rounded-[10px] border-0 bg-secondary px-0 text-[12px] font-heading font-normal text-muted-foreground shadow-none hover:bg-secondary"
        >
          <Image
            alt=""
            aria-hidden="true"
            src="/google.svg"
            width={14}
            height={14}
          />
          <span className="ml-2 leading-[15px]">Sign in with Google</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-[30px] w-[180px] rounded-[10px] border-0 bg-secondary px-0 text-[12px] font-heading font-normal text-muted-foreground shadow-none hover:bg-secondary"
        >
          <Apple className="h-[14px] w-[11.5px]" />
          <span className="ml-2 leading-[15px]">Sign in with Apple</span>
        </Button>
      </div>
      <div className="mt-[25px] rounded-[20px] bg-card px-[30px] py-[30px]">
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div>
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
            <Input
              autoComplete="current-password"
              className="mt-[10px] h-10 rounded-[10px] border-0 bg-input px-[15px] text-base shadow-none focus-visible:ring-2"
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="mt-[21px]">
            <Link
              className="text-base leading-[19px] text-[var(--link)] hover:underline"
              href="#"
            >
              Forgot password?
            </Link>
          </div>

          <AuthSubmitButton
            className="mt-[20px]"
            loading={isSubmitting}
            loadingText="Signing in..."
          >
            Sign In
          </AuthSubmitButton>
        </form>
      </div>

      <p className="mt-[20px] text-center text-base leading-[19px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link className="text-[var(--link)] hover:underline" href="#">
          Register here
        </Link>
      </p>
    </div>
  );
}
