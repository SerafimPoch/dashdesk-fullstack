import * as React from "react";
import { SearchIcon } from "@/ui/icons";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.ComponentProps<"input"> {
  containerClassName?: string;
}

export function SearchInput({
  className,
  containerClassName,
  placeholder = "Search...",
  type = "text",
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn("relative h-[30px] w-[180px] shrink-0", containerClassName)}
    >
      <input
        type={type}
        placeholder={placeholder}
        className={cn(
          "h-full w-full rounded-[8px] border-0 bg-card pl-[14px] pr-[28px] text-[10px] leading-none text-foreground shadow-[0_4px_14px_rgba(17,17,17,0.06)] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
        {...props}
      />
      <SearchIcon
        className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-muted-foreground"
        size={13}
      />
    </div>
  );
}
