import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { PlusIcon } from "@/ui/icons";

type AddButtonProps = React.ComponentProps<typeof Button> & {
  iconClassName?: string;
  iconSize?: number;
};

export function AddButton({
  className,
  children = "Add",
  iconClassName,
  iconSize = 20,
  type = "button",
  ...props
}: AddButtonProps) {
  return (
    <Button
      type={type}
      className={cn(
        "h-[30px] w-[80px] cursor-pointer gap-[5px] rounded-[10px] bg-primary px-0 font-heading text-[14px] leading-[17px] font-bold text-primary-foreground hover:bg-primary/90",
        className,
      )}
      {...props}
    >
      <PlusIcon className={cn("h-5 w-5", iconClassName)} size={iconSize} />
      {children}
    </Button>
  );
}
