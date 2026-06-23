"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import Image from "next/image";
import { type ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "../settings.queries";
import { getAvatarImageUrl } from "@/lib/utils";
import type { SettingsResponse, UpdateProfileBody } from "../settings.api";

interface SettingsProfileFormProps {
  settings: SettingsResponse;
}

interface SettingsProfileFormValues {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
}

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const settingsProfileSchema = v.object({
  firstName: v.pipe(v.string(), v.trim(), v.maxLength(50)),
  lastName: v.pipe(v.string(), v.trim(), v.maxLength(50)),
  dateOfBirth: v.pipe(
    v.string(),
    v.regex(/^(?:|\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/),
  ),
  phoneNumber: v.pipe(v.string(), v.trim(), v.maxLength(30)),
  address: v.pipe(v.string(), v.trim(), v.maxLength(200)),
});

function getProfileInitials(settings: SettingsResponse) {
  const names = [settings.profile.firstName, settings.profile.lastName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().charAt(0).toUpperCase())
    .join("");

  if (names.length > 0) {
    return names.slice(0, 2);
  }

  return settings.account.email.charAt(0).toUpperCase();
}

export function SettingsProfileForm({ settings }: SettingsProfileFormProps) {
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const profileValues: SettingsProfileFormValues = {
    firstName: settings.profile.firstName ?? "",
    lastName: settings.profile.lastName ?? "",
    dateOfBirth: settings.profile.dateOfBirth ?? "",
    phoneNumber: settings.profile.phoneNumber ?? "",
    address: settings.profile.address ?? "",
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsProfileFormValues>({
    resolver: valibotResolver(settingsProfileSchema),
    defaultValues: profileValues,
  });
  const avatar = settings.profile.avatar;
  const avatarErrorMessage =
    uploadAvatarMutation.error instanceof Error
      ? uploadAvatarMutation.error.message
      : avatarError;
  const profileErrorMessage =
    updateProfileMutation.error instanceof Error
      ? updateProfileMutation.error.message
      : undefined;

  const submitProfile = async (values: SettingsProfileFormValues) => {
    setProfileMessage(null);

    const payload: UpdateProfileBody = {
      firstName: values.firstName.trim() || undefined,
      lastName: values.lastName.trim() || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      phoneNumber: values.phoneNumber.trim() || undefined,
      address: values.address.trim() || undefined,
    };

    try {
      const savedProfile = await updateProfileMutation.mutateAsync(payload);

      reset({
        firstName: savedProfile.firstName ?? "",
        lastName: savedProfile.lastName ?? "",
        dateOfBirth: savedProfile.dateOfBirth ?? "",
        phoneNumber: savedProfile.phoneNumber ?? "",
        address: savedProfile.address ?? "",
      });
      setProfileMessage("Profile saved");
    } catch {}
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    input.value = "";
    setAvatarError(null);
    setAvatarMessage(null);
    uploadAvatarMutation.reset();

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
      setAvatarError("Avatar must be a PNG, JPG, or WebP image");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("Avatar must be 2MB or smaller");
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      setAvatarMessage("Avatar uploaded");
    } catch {}
  };

  return (
    <div className="grid gap-6 md:grid-cols-[100px_328px] md:items-start md:gap-[40px]">
      <div className="flex flex-col items-start gap-[10px]">
        <div className="relative flex size-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-primary">
          {avatar ? (
            <Image
              src={getAvatarImageUrl(avatar)}
              alt="Profile avatar"
              className="h-full w-full object-cover"
              fill
              sizes="100px"
              unoptimized
            />
          ) : (
            <span className="font-heading text-[28px] leading-none font-bold">
              {getProfileInitials(settings)}
            </span>
          )}
        </div>

        <Input
          id="settings-avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Avatar image"
          onChange={handleAvatarChange}
        />
        <Label
          htmlFor="settings-avatar"
          className="ml-4 inline-flex h-[21px] w-[68px] cursor-pointer items-center justify-center rounded-[5px] border border-muted-foreground bg-card font-heading text-[10px] leading-none font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
        >
          {uploadAvatarMutation.isPending ? "..." : "Change"}
        </Label>
        <div className="min-h-[16px] w-full">
          {avatarMessage ? (
            <p className="text-xs leading-4 text-primary">{avatarMessage}</p>
          ) : null}
          {avatarErrorMessage ? (
            <p className="text-xs leading-4 text-destructive">
              {avatarErrorMessage}
            </p>
          ) : null}
        </div>
      </div>

      <form
        noValidate
        className="grid gap-[20px] md:w-[328px]"
        onSubmit={handleSubmit(submitProfile)}
      >
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-[140px_140px] sm:gap-[24px]">
          <div className="grid gap-[10px]">
            <Label
              className="text-[16px] leading-[19px] text-card-foreground"
              htmlFor="settings-first-name"
            >
              First Name
            </Label>
            <Input
              autoComplete="given-name"
              className="h-[40px] rounded-[10px] border-0 bg-background px-[14px] text-[16px] shadow-none"
              id="settings-first-name"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? "settings-first-name-error" : undefined
              }
              {...register("firstName")}
            />
            {errors.firstName ? (
              <p
                className="mt-1 text-xs text-destructive"
                id="settings-first-name-error"
              >
                {errors.firstName.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-[10px]">
            <Label
              className="text-[16px] leading-[19px] text-card-foreground"
              htmlFor="settings-last-name"
            >
              Last Name
            </Label>
            <Input
              autoComplete="family-name"
              className="h-[40px] rounded-[10px] border-0 bg-background px-[14px] text-[16px] shadow-none"
              id="settings-last-name"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={
                errors.lastName ? "settings-last-name-error" : undefined
              }
              {...register("lastName")}
            />
            {errors.lastName ? (
              <p
                className="mt-1 text-xs text-destructive"
                id="settings-last-name-error"
              >
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid max-w-[325px] gap-[20px]">
          <div className="grid gap-[10px]">
            <Label
              className="text-[16px] leading-[19px] text-card-foreground"
              htmlFor="settings-date-of-birth"
            >
              Date of Birth
            </Label>
            <Input
              className="h-[40px] rounded-[10px] border-0 bg-background px-[14px] text-[16px] shadow-none"
              id="settings-date-of-birth"
              type="date"
              aria-invalid={Boolean(errors.dateOfBirth)}
              aria-describedby={
                errors.dateOfBirth ? "settings-date-of-birth-error" : undefined
              }
              {...register("dateOfBirth")}
            />
            {errors.dateOfBirth ? (
              <p
                className="mt-1 text-xs text-destructive"
                id="settings-date-of-birth-error"
              >
                {errors.dateOfBirth.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-[10px]">
            <Label
              className="text-[16px] leading-[19px] text-card-foreground"
              htmlFor="settings-phone-number"
            >
              Phone Number
            </Label>
            <Input
              autoComplete="tel"
              className="h-[40px] rounded-[10px] border-0 bg-background px-[14px] text-[16px] shadow-none"
              id="settings-phone-number"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={
                errors.phoneNumber ? "settings-phone-number-error" : undefined
              }
              {...register("phoneNumber")}
            />
            {errors.phoneNumber ? (
              <p
                className="mt-1 text-xs text-destructive"
                id="settings-phone-number-error"
              >
                {errors.phoneNumber.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-[10px]">
            <Label
              className="text-[16px] leading-[19px] text-card-foreground"
              htmlFor="settings-address"
            >
              Address
            </Label>
            <Input
              autoComplete="street-address"
              className="h-[40px] rounded-[10px] border-0 bg-background px-[14px] text-[16px] shadow-none"
              id="settings-address"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={
                errors.address ? "settings-address-error" : undefined
              }
              {...register("address")}
            />
            {errors.address ? (
              <p
                className="mt-1 text-xs text-destructive"
                id="settings-address-error"
              >
                {errors.address.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex max-w-[325px] flex-col gap-3 pt-[10px] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[16px]">
            {profileMessage ? (
              <p className="text-xs text-primary">{profileMessage}</p>
            ) : null}
            {profileErrorMessage ? (
              <p className="text-xs text-destructive">{profileErrorMessage}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            aria-label="Save profile"
            className="h-[40px] w-[112px] rounded-[10px] px-0 font-heading text-[16px] font-bold"
            disabled={isSubmitting || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
