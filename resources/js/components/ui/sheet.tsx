import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Sheet({ ...props }: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

export function SheetTrigger({ ...props }: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-[#172033]/40" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar text-sidebar-foreground shadow-xl outline-none",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">Navigation</Dialog.Title>
        {children}
        <Dialog.Close className="absolute right-3 top-3 rounded-md p-1 text-sidebar-foreground/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
