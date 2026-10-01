import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ ...props }: ComponentProps<typeof Dropdown.Root>) {
  return <Dropdown.Root {...props} />;
}

export function DropdownMenuTrigger({ ...props }: ComponentProps<typeof Dropdown.Trigger>) {
  return <Dropdown.Trigger {...props} />;
}

export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={8}
        align="end"
        className={cn(
          "z-50 min-w-44 rounded-md border border-border bg-card p-1 text-foreground shadow-md",
          className,
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none focus:bg-secondary",
        className,
      )}
      {...props}
    />
  );
}
