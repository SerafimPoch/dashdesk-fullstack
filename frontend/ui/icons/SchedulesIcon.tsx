import type { IconProps } from "./types";

export function SchedulesIcon({
  size = 20,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M7.05 16.95H4.35C3.39522 16.95 2.47955 16.5707 1.80442 15.8956C1.12928 15.2205 0.75 14.3048 0.75 13.35V5.25002C0.75 4.29525 1.12928 3.37957 1.80442 2.70444C2.47955 2.02931 3.39522 1.65002 4.35 1.65002H14.25C15.2048 1.65002 16.1205 2.02931 16.7956 2.70444C17.4707 3.37957 17.85 4.29525 17.85 5.25002V7.95002"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.15002 0.75V2.55"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.45 0.75V2.55"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.75 6.15002H17.85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6 13.0287L14.25 14.3787"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.25 18.75C16.7353 18.75 18.75 16.7353 18.75 14.25C18.75 11.7647 16.7353 9.75 14.25 9.75C11.7647 9.75 9.75 11.7647 9.75 14.25C9.75 16.7353 11.7647 18.75 14.25 18.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
