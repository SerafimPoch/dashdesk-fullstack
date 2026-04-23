import * as React from "react";

import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
}

export function AuthSubmitButton({
  children,
  className,
  loading = false,
  loadingText = "Please wait...",
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn(
        "h-10 w-full cursor-pointer rounded-[10px] bg-primary text-base font-heading font-bold text-primary-foreground hover:bg-primary/90",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
}
