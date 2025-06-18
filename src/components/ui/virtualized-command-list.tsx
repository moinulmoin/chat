"use client";

import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import { VList, VListHandle, VListProps } from "virtua";

const VirtualizedCommandList = React.forwardRef<
  VListHandle,
  {
    children: React.ReactNode;
    className?: string;
  } & Omit<VListProps, "children">
>(({ children, className, ...props }, ref) => {
  const Children = React.Children.toArray(children);

  return (
    <CommandPrimitive.List
      className={cn("scroll-py-1", className)}
    >
      <VList ref={ref} {...props}>
        {Children.map((child) => (
          <div key={(child as React.ReactElement).key || undefined}>{child}</div>
        ))}
      </VList>
    </CommandPrimitive.List>
  );
});

VirtualizedCommandList.displayName = "VirtualizedCommandList";

export { VirtualizedCommandList };
