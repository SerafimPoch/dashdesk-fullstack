"use client";

import * as React from "react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";

export interface PopupProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
}

function Popup({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  overlayClassName,
  showCloseButton = true,
}: PopupProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return trigger ?? null;
  }

  return (
    <Dialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            overlayClassName
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[16px] border border-border bg-popover p-6 text-popover-foreground shadow-[0_24px_70px_rgba(17,17,17,0.18)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:w-full",
            className
          )}
        >
          <div className="grid gap-2 pr-8">
            <Dialog.Title className="font-heading text-[20px] leading-[24px] font-bold text-popover-foreground">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="text-sm leading-5 text-muted-foreground">
                {description}
              </Dialog.Description>
            ) : null}
          </div>

          {showCloseButton ? (
            <Dialog.Close
              type="button"
              aria-label="Close popup"
              className="absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className="absolute h-[2px] w-4 rotate-45 rounded-full bg-current"
                aria-hidden="true"
              />
              <span
                className="absolute h-[2px] w-4 -rotate-45 rounded-full bg-current"
                aria-hidden="true"
              />
            </Dialog.Close>
          ) : null}

          <div className={cn("min-w-0", contentClassName)}>{children}</div>

          {footer ? (
            <div className="flex items-center justify-end gap-2">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Popup };
