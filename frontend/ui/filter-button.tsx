import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { FilterIcon } from "@/ui/icons";

type FilterButtonProps = React.ComponentProps<typeof Button>;

export function FilterButton({
  className,
  children = "Filter",
  type = "button",
  ...props
}: FilterButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      className={cn(
        "h-[30px] w-[84px] cursor-pointer gap-[5px] rounded-[10px] border-[#B0B0B0] bg-card px-0 font-heading text-[14px] leading-[17px] font-bold text-muted-foreground hover:bg-card hover:text-muted-foreground",
        className,
      )}
      {...props}
    >
      <FilterIcon className="h-[14px] w-[18px]" size={18} />
      {children}
    </Button>
  );
}
