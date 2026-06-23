import { apiClient } from "@/lib/api-client";
import type { AvatarMetadata } from "@/lib/utils";

interface DeleteAccountBody {
  confirmEmail: string;
  currentPassword?: string;
}

interface UpdateSecurityBody {
  twoFactorEnabled: boolean;
}

interface UpdateAccountBody {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface SettingsSecurity {
  twoFactorEnabled: boolean;
}

interface SettingsAccount {
  email: string;
  hasPassword: boolean;
}

interface SettingsProfile {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  address: string | null;
  avatar: AvatarMetadata | null;
}

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
}

export interface SettingsResponse {
  profile: SettingsProfile;
  account: SettingsAccount;
  security: SettingsSecurity;
}

export async function getSettings(): Promise<SettingsResponse> {
  const response = await apiClient.get<SettingsResponse>("/settings");

  return response.data;
}

export async function updateProfile(
  body: UpdateProfileBody,
): Promise<SettingsProfile> {
  const response = await apiClient.patch<SettingsProfile>(
    "/settings/profile",
    body,
  );

  return response.data;
}

export async function uploadAvatar(file: File): Promise<AvatarMetadata> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<AvatarMetadata>(
    "/settings/avatar",
    formData,
  );

  return response.data;
}

export async function updateAccount(
  body: UpdateAccountBody,
): Promise<SettingsAccount> {
  const response = await apiClient.patch<SettingsAccount>(
    "/settings/account",
    body,
  );

  return response.data;
}

export async function updateSecurity(
  body: UpdateSecurityBody,
): Promise<SettingsSecurity> {
  const response = await apiClient.patch<SettingsSecurity>(
    "/settings/security",
    body,
  );

  return response.data;
}

export async function deleteAccount(body: DeleteAccountBody): Promise<void> {
  await apiClient.delete("/settings/account", {
    data: body,
  });
}
