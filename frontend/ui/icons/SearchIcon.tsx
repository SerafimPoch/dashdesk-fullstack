import type { IconProps } from "./types";

export function SearchIcon({
  size = 13,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 13 12"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <circle cx="5" cy="5" r="4.5" fill="none" stroke="currentColor" />
      <line x1="8.35355" y1="7.64645" x2="12.3536" y2="11.6464" stroke="currentColor" />
    </svg>
  );
}
