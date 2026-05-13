import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/ui/icons";

interface TableSearchInputProps extends React.ComponentProps<"input"> {
  containerClassName?: string;
}

export function TableSearchInput({
  className,
  containerClassName,
  placeholder = "Search in table...",
  type = "text",
  ...props
}: TableSearchInputProps) {
  return (
    <div
      className={cn("relative h-[30px] w-[173px] shrink-0", containerClassName)}
    >
      <input
        type={type}
        placeholder={placeholder}
        className={cn(
          "h-full w-full rounded-[10px] border-0 bg-background pl-[15px] pr-[34px] text-[14px] leading-[17px] text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
        {...props}
      />
      <SearchIcon
        className="pointer-events-none absolute top-1/2 right-[17px] -translate-y-1/2 text-muted-foreground"
        size={12}
      />
    </div>
  );
}
