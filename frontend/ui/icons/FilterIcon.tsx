import type { IconProps } from "./types";

export function FilterIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 14"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1 1H17L10.6 7.4V12L7.4 13V7.4L1 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
