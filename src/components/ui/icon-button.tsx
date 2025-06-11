"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as React from "react";

interface IconButtonProps extends React.ComponentProps<typeof Button> {
  icon: React.ReactNode;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

const IconButton = ({
  icon,
  tooltip,
  tooltipSide = "bottom",
  className,
  ...props
}: IconButtonProps) => {
  const button = (
    <Button className={cn("hover:bg-background", className)} {...props}>
      {icon}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide as "top" | "right" | "bottom" | "left"} className="bg-primary/80 text-primary-foreground">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

export { IconButton };
