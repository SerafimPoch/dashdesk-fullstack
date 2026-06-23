import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export interface AvatarMetadata {
  url: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarImageUrl(avatar: AvatarMetadata) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const path = avatar.url.startsWith("/") ? avatar.url : `/${avatar.url}`;

  return `${apiOrigin}${path}?v=${encodeURIComponent(avatar.updatedAt)}`;
}
