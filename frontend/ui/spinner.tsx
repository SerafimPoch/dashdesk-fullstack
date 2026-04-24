import { cn } from "@/lib/utils";

interface SpinnerProps extends React.ComponentProps<"div"> {
  label?: string;
}

export function Spinner({
  className,
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("relative inline-flex h-10 w-10", className)}
      {...props}
    >
      <span className="absolute inset-0 rounded-full border-[3px] border-current opacity-15" />
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-current border-r-current" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
