import type { IconProps } from "./types";

export function MicrosoftIcon({
  size = 14,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M0 0H6.65V6.65H0V0Z" fill="#F25022" />
      <path d="M7.35 0H14V6.65H7.35V0Z" fill="#7FBA00" />
      <path d="M0 7.35H6.65V14H0V7.35Z" fill="#00A4EF" />
      <path d="M7.35 7.35H14V14H7.35V7.35Z" fill="#FFB900" />
    </svg>
  );
}
